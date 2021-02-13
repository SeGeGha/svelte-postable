import { plainToClass, serialize } from 'class-transformer'
import { validate } from 'class-validator'

type ClassType<T> = {
    new(...args: any[]): T;
};

export class PostableListResponse {
    private req: any;
    private res: any;
    private out = {
        d: undefined,
        rm: undefined,
        s: undefined,
        ev: undefined,
        em: undefined,
        x: undefined,
    };

    private _session_changed: boolean = false;
    private _transform_options: any = {};

    protected getRequest() {
        return this.req;
    }

    constructor(req, res) {
        this.req = req;
        this.res = res;

        if (req.method.toUpperCase() === 'POST' && !Array.isArray(req.body)) {
            res.status(422);
            res.end();
        }

    }

    /**
     * @return an array of object received from the client
     */
    getRequestArray() {
        return this.req.body;
    }

    /**
     * @return a single object received from the client
     */
    getRequestObject() {
        return this.req.body[0];
    }

    /**
     * @brief validate the received object using `class-validator`;
     *     objClass should containt necessary decorators;
     *     if there's validation error, this.hasError() will return true after the call of this method
     * @param objClass -- the class of model entity
     * @param options -- options to pass to `plainToClass` to convert a plain object to
     * @return single received object of type `objClass` in any case
     */
    async getRequestObjectAndValidate<T>(cls: ClassType<T>, options = undefined): Promise<T> {
        const o: any = this.getRequestObject();
        const f: <U>(cls: ClassType<T>, obj: any, opts?: any) => T = plainToClass;
        const oc: T = f(cls, o, options)
        const errors = await validate(oc);
        if (errors.length) {
            this.pushValidationErrors(errors);
        }
        return oc;
    }

    /**
     * @brief add data to the output to be sent to the client
     */
    pushDatum(obj: any) {
        if (this.out.d) {
            this.out.d.push(obj);
        } else {
            this.out.d = [obj];
        }
    }

    /**
     * @brief add data to the output to be sent to the client
     */
    pushData(arr: any[]) {
        if (this.out.d) {
            this.out.d = this.out.d.concat(arr);
        } else {
            this.out.d = arr;
        }
    }

    pushRemoveId(id) {
        if (this.out.rm) {
            this.out.rm.push(id);
        } else {
            this.out.rm = [id];
        }
    }

    pushValidationError(obj: any) {
        if (this.out.ev) {
            this.out.ev.push(obj);
        } else {
            this.out.ev = [obj];
        }
    }

    pushValidationErrors(arr: any[]) {
        if (this.out.ev) {
            this.out.ev = this.out.ev.concat(arr);
        } else {
            this.out.ev = arr;
        }
    }

    /**
     * @return true if there is at least one error of any type (common or validation error) occured during the operaion of this object
     */
    hasError() {
        if ((this.out.ev && this.out.ev.length) || (this.out.em && this.out.em.length)) return true;
        return false;
    }

    /**
     * @brief set the session item, the updated session is to be send to the client, to be updated at the Sapper's $session storage;
     *     but in this case there's need to extend this class and override the `transformSession()` method
     */
    setSessionItem(key: string, obj: any) {
        this.req.session[key] = obj;
        this._session_changed = true;
    }

    refreshSesion() {
        console.error('parent PostableListResponse::refreshSession() called directly');
    }

    /**
     * @brief transforms the server-side session object to be sent to the client; should be overriden in the application
     * @param sess -- the server-side session object
     */
    transformSession(sess: any) {
        // transform the server session (which is `sess`) for use on the client and return it
        return {};
    }

    setExtra(key: string, value: any) {
        if (!this.out.x) {
            this.out.x = { [key]: value };
        } else {
            this.out.x[key] = value;
        }
    }

    setSerializeGroup(group: string) {
        this._transform_options.groups = [group];
    }

    end() {
        if (this._session_changed) {
            this.out.s = this.transformSession(this.req.session);
        }

        this.res.set('content-type', 'application/json');
        this.res.end(serialize(this.out, this._transform_options));
    }

    /**
     * @brief Set an error message to display on the client
     */
    setError(error_message: string) {
        this.out.em = error_message;
    }

    endWithError(error_message: string) {
        this.setError(error_message);
        this.end();
    }

}
