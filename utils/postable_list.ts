import { writable } from 'svelte/store'
import type { Readable } from 'svelte/store';

export enum MetaStatus {
    None,
    Uninitialized,
    Getting,
    Posting,
    Deleting,
    LoadingMore,
    Loaded,
    ValidationError,
    Error
};

export const LOADING_STATUSES = [MetaStatus.Getting, MetaStatus.Posting, MetaStatus.Deleting, MetaStatus.LoadingMore];
export const STABLE_STATUSES = [MetaStatus.Uninitialized, MetaStatus.Loaded];

interface MetaHistoryItem {
    meta: Meta,
    data?: Array<any>,
    extra?: any
}

class Meta {
    public status: MetaStatus;
    public ts: Date;

    public subj_ids: Array<number>; // ids of the operaion subject, e.g. ids of the posting documents

    public error?: Error;
    public error_validation?: Array<any>; // https://github.com/typestack/class-validator#validation-errors

    private _history: Array<MetaHistoryItem>;

    // TODO: add the data to history where applicable in the 'new Meta' constructions in this file
    // TODO: add extra also
    constructor(status: MetaStatus, prev?: MetaHistoryItem) {
        this.status = status;
        this.ts = new Date();
        if (prev) {
            // current object will be passed to the newly constructed Meta on each status change
            this._history = [...prev.meta._history, prev];
        } else {
            this._history = [];
        }
    }

    prev_status(): MetaStatus {
        if (this._history.length) {
            return this._history[this._history.length - 1].meta.status;
        } else {
            return MetaStatus.None;
        }
    }

    prev_stable(): MetaHistoryItem {
        for (let i = this._history.length - 1; i >= 0; --i) {
            if (STABLE_STATUSES.indexOf(this._history[i].meta.status) !== -1) {
                return this._history[i];
            }
        }
        return null;
    }
}

class ValidationError extends Error { }

function _update_meta_with_error(err: Error) {
    return function (stored) {
        const _meta = new Meta(MetaStatus.Error, { meta: stored.meta });
        _meta.subj_ids = stored.meta.subj_ids;
        _meta.error = err;
        return {
            meta: _meta,
            data: stored.data,
            extra: stored.extra
        };
    };
}

function _update_meta_with_validation_error(validation_array: Array<any>) {
    return function (stored) {
        const _meta = new Meta(MetaStatus.ValidationError, { meta: stored.meta });
        _meta.subj_ids = stored.meta.subj_ids;
        _meta.error = new ValidationError();
        _meta.error_validation = validation_array;
        return {
            meta: _meta,
            data: stored.data,
            extra: stored.extra
        };
    };
}

function _json_errors(update, json) {
    if (json.ev) {
        update(_update_meta_with_validation_error(json.ev));
        // if ( on_error ) { on_error( json.ev ); }
        return true;
    }

    // some error came from the server, stating the object was not saved, e.g. database error
    if (json.em) {
        update(_update_meta_with_error(new Error(json.em)));
        // if ( on_error ) { on_error( json.em ); }
        return true;
    }

    if (!('d' in json)) {
        update(_update_meta_with_error(new Error('missing data')));
        return true;
    }

    return false; // means 'no errors'
}

interface PostableListStoredObject {
    meta: Meta,
    data: any[],
    extra: any
}

export interface PostableListStore extends Readable<PostableListStoredObject> {

    /**
     * get array of objects from server and update the list with received docs
     * @param {string} url_to_get? -- optional url to get info from if differs from the `default_url` param with which the list was initialized
     * @return {any|false} on success -- the received json object, on error -- false
     */
    get: (url_to_get?: string, data_overwrite?: boolean) => false | any,

    /**
     * post object to server, get return and update the list with received docs
     * @param {any} obj -- object or array of objects,
     * @return {any|false} on success -- the received json object, on error -- false
     */
    post: (obj: any, url_to_post?: string) => false | any,

    del: (obj: any, url_to_post?: string) => false | any,

    /**
     * performs a GET request to server intended to load additional list items, get return and update the list with received docs
     * @return {any|false} on success -- the received json object, on error -- false
     */
    more: (url_to_get_more?: string) => false | any

    set_session_store: (session_store: any) => void,

    get_default_url: () => string,

    to_stable: () => void,

}

/**
 * @brief the store containing a list which can be updated from server via posting.
 * It can be initialized with a `src_list` param so then it will have the `Loaded` status upon creation,
 * or not initialized -- will be autoinitialized with an empty array but will have an `Unitialized` status upon creation
 * @param default_url {string} -- the default URL to which the POST or GET will be issued if omitted in `get()` or `post()` methods
 * @param src_list {any[]} -- an optional initial list object to be initalized from, e.g. got from prefetch() data;
 * @return {PostableListStore} the store-like object
 */
export function postable_list(default_url: string, src_list?: any[] /* , on_error?: (validation_array)=>void */): PostableListStore {

    const _is_initialized: boolean = src_list && Array.isArray(src_list);
    const _stored: PostableListStoredObject = {
        meta: new Meta(_is_initialized ? MetaStatus.Loaded : MetaStatus.Uninitialized),
        data: _is_initialized ? src_list : [],
        extra: {}
    };
    const { subscribe, set, update } = writable(_stored);

    let last = _stored.data[_stored.data.length - 1];

    let _session_store = null;

    const _execute_the_fetch = async function (url_nondefault, fetch_options) {
        try {

            const res = await fetch(url_nondefault || default_url, fetch_options);

            // request error
            if (!res.ok) {
                update(_update_meta_with_error(new Error('error requesting data')));
                // await res.blob()
                return false;
            }

            // request ok
            const json = await res.json();

            /*
            json.d -- data
            json.em -- some common text error message
            json.ev -- validation error, here's the array as in https://github.com/typestack/class-validator#validation-errors
            */

            if (_json_errors(update, json)) {
                return false;
            }

            update(stored => {

                let new_stored_data;
                if (stored.data.length === 0) {
                    // if store is empty -- just place received array there
                    new_stored_data = json.d;
                } else {
                    // if store is non-empty -- loop through received items and replace those which
                    // have the same ids, or insert a new element if nothing found to replace
                    // and besides that remove items that has been required to remove
                    for (let i = 0; i < json.d.length; ++i) {
                        const j = stored.data.findIndex(it => it.id == json.d[i].id);

                        if (j !== -1) {
                            stored.data[j] = { ...stored.data[j], ...json.d[i] };
                        } else {
                            stored.data[stored.data.length] = json.d[i];
                        }
                    }
                    new_stored_data = ('rm' in json && json.rm.length ? stored.data.filter(it => json.rm.indexOf(it.id) === -1) : stored.data);
                }
                last = new_stored_data[new_stored_data.length - 1];

                let new_stored: PostableListStoredObject = {
                    meta: new Meta(MetaStatus.Loaded, { meta: stored.meta }),
                    data: new_stored_data,
                    extra: json.x || {}
                };

                if (_session_store && 's' in json) {
                    _session_store.set(json.s);
                }

                return new_stored;

            }); // update()

            // return to the post() caller just the received thing
            return json.d;

        } catch (ex) {
            // fetch() failed -- update just meta, with an Error status
            update(_update_meta_with_error(ex));
            return false;
        }
    } // _execute_the_fetch()

    return {
        subscribe,
        get_default_url: function () { return default_url; },
        set_session_store: function (session_store) { _session_store = session_store; },

        // reset plist to the previous stable (i.e. Loaded) state in history, or leave at the current if it is stable
        to_stable: function () {
            update(stored => {
                if (STABLE_STATUSES.indexOf(stored.meta.status) !== -1) {
                    return stored;
                } else {
                    const prev = stored.meta.prev_stable();
                    if (prev) {
                        return {
                            meta: prev.meta,
                            data: prev.data || stored.data,
                            extra: prev.extra || stored.extra
                        };
                    } else {
                        return stored;
                    }
                }
            });
        },

        get: async function (url_to_get?: string, data_overwrite?: boolean) {

            if (typeof fetch === 'undefined') return [];

            // update just meta, with a Getting status
            update(stored => {
                const _meta = new Meta(MetaStatus.Getting, { meta: stored.meta });
                return {
                    meta: _meta,
                    data: data_overwrite ? [] : stored.data,
                    extra: stored.extra
                }
            });

            return _execute_the_fetch(
                url_to_get,
                {
                    method: 'GET',
                    headers: { 'accept': 'application/json' },
                    credentials: 'include'
                }
            );

        },
        post: async function (obj: any, url_to_post?: string) {

            const aobj = (Array.isArray(obj) ? obj : [obj]);

            // update just meta, with a Posting status
            update(stored => {
                const _meta = new Meta(MetaStatus.Posting, { meta: stored.meta });
                _meta.subj_ids = aobj.map(it => it.id);
                return {
                    meta: _meta,
                    data: stored.data,
                    extra: stored.extra
                }
            });

            return _execute_the_fetch(
                url_to_post,
                {
                    method: 'POST',
                    headers: { 'content-type': 'application/json', 'accept': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(aobj)
                }
            );
        },
        del: async function (obj: any, url_to_post?: string) {
            const aobj = (Array.isArray(obj) ? obj : [obj]);

            // update just meta, with a Posting status
            update(stored => {
                const _meta = new Meta(MetaStatus.Posting, { meta: stored.meta });
                _meta.subj_ids = aobj.map(it => it.id);
                return {
                    meta: _meta,
                    data: stored.data,
                    extra: stored.extra
                }
            });

            return _execute_the_fetch(
                url_to_post,
                {
                    method: 'DELETE',
                    headers: { 'content-type': 'application/json', 'accept': 'application/json' },
                    credentials: 'include',
                    body: JSON.stringify(aobj)
                }
            );
        },

        more: async function (url_to_get_more?: string) {
            if (last) {

                // update just meta
                update(stored => ({ meta: new Meta(MetaStatus.LoadingMore, { meta: stored.meta }), data: stored.data, extra: stored.extra }));

                const url = (url_to_get_more || default_url);
                return _execute_the_fetch(
                    url + (url.indexOf('?') === -1 ? '?' : '&') + 'after=' + last.id,
                    {
                        method: 'GET',
                        headers: { 'accept': 'application/json' },
                        credentials: 'include'
                    }
                );

            }

            // something wrong
            return false;
        }, // more()
    }
} // postable_list()



// // //   server helpers   // // //
import { serialize } from 'class-transformer'

/**
 * @brief To be used server-side to handle each item of the posted array
 * @return array of all the each() returns
 */
export async function process_posted(req, res, each): Promise<any[]> {

    if (!Array.isArray(req.body)) {
        res.status(422);
        res.end();
        return [];
    }
    let out = [];
    for (let i = req.body.length - 1; i >= 0; --i) {
        out.push(await each(req.body[i]));
    }
    return out;
}

/**
 * @brief return items concatenated as if it was stringified array of objects
 */
export async function process_posted_str_and_end(req, res, each) {
    res.end('{"d":' + serialize(await process_posted(req, res, each)) + '}');
}
