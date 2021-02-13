# Postable Library

## postable_list/

### postable_list.ts

A reactive list able to be updated from server via getting or posting, based on Svelte stores.

#### Usage

Create and initialize: The `postable_list()` function will create a subscribable object having additional methods besides the default Svelte store's `subscribe()`.

This component awaits that stored objects will have unique ids in the `id` field. New objects got from server with ids matching local objects will be *overwritten* on updates. Other objects will be appended.

The `postable_list()` params are following:

* the default URL to operate during server requests;
* the optional initial contents of the list -- an array of objects.

```
// this will result in Uninitialized list that's planned to be loaded later, e.g. in the onMount
const list = postable_list( '/api/save-item' );

// this will result in an initialized list having a Loaded status
const list = postable_list( '/api/save-item', [ { id : 1, name : 'XXX' } ] );
```

Now that `list` can be used as a Svelte store (as `$list`) wich has the following mandatory fields (see `interface PostableListStoredObject`):

* `$list.data` -- the array of objects, after creation it will be initialized with the specified array, and it will be updated later according to the server request results;
* `$list.meta` -- operation information: status, timestamps, errors if any, etc -- see `class Meta`.

The following code will iterate through the single object initially put inside of the `list` and will output 'XXX':

```
{#each $list.data as item(item.id)}
	{item.name}
{/each}
```

The `list` object has the following additional methods (see `interface PostableListStore`):

* `list.get()` -- will issue a GET-request to the server, by default to the URL specified upon the `list` creation, but optionally this method can get an alternative URL to which the request will be issued;
* `list.post( obj )` -- will POST an `obj` to the list's default url, or to the optional url given to this method as a second param;
* `list.more()` -- will issue a special GET-request to the server to fetch additional items, e.g. for the infinite scroll; can optionally get an alternative URL as well.

The following code will issue a POST-request to the server, in intent to add a new item. We suppose the server will do some processing and assing an id to the newly created object:

```
list.post( { name : 'ZZZ' } );
```

The metadata can be monitored for the state of the request and some additional info (see `class Meta`), so for exapmple we can know some technical details about the request.

The following code will show the 'Loading' message immediately after the abobe `list.post()` call and replace it with the 'XXX ZZZ' on the request finish:

```
{#if $list.meta.status === MetaStatus.LoadingMore }
	Loading...
{:else}
	{#each $list.data as item(item.id)}
		{item.name}
	{/each}
{/if}
```

Server may want to return an error, so we should properly process that situation:

* `$list.meta.error` -- may contain info about some exceptional happening, e.g. database error;
* `$list.meta.error_validation` -- may contain an array of the validation errors, if the posted object was not pass the server-side validation process.

The `$list.meta.status` in such case will be set respectively to `MetaStatus.Error` or `MetaStatus.ValidationError`:

```
{#if $list.meta.status === MetaStatus.Error }
	Error!
	{$list.meta.error}
{:else if $list.meta.status === MetaStatus.ValidationError }
	{#each $list.meta.error_validation as ve}
		{ve}
	{/each}
{/if}
```

See also comments there in source.

### postable_list_response.ts

A class to be used on the server side to prepare the response (for POST and GET methods) and process a request (for POST method) of client-initiated `postable_list` action.

#### Usage

Simplest — initialize, add data, send response:

```typescript
export async function get(req, res, next) {
	const plr = new PostableListResponse( req, res );
	plr.pushDatum( { id: 1, name: 'xxx' } );
	plr.end();
}
```

The details.

In the server handler, initialize the object:

```
export async function post(req, res, next) {
	const plr = new PostableListResponse( req, res );
	...
```

Get the single object or the array of object, received from the client:

```
	const o = plr.getRequestObject();
	const a = plr.getRequestArray();
```

Can go through validation with `class-validator`. Here, the request object will be converted to class `User` and thus it should include validation decorators:

```typescript
	const user: User = await plr.getRequestObjectAndValidate( { groups: ['signup'] } );
	if ( plr.hasError() ) {
		// there's validation error, but 'user' do contain its data got from client

		// this will finish send a found errors to the client:
		plr.end();
		return;
	}

	// also, we can do some custom checks and add the error notification manually
	if ( custom_checks_failed ) {
		plr.pushValidationError({
			target: user,
			value: user.email,
			property: 'email',
			children: [],
			constraints: { email_exists : 'User with this email is alreasy exists' }
		});
		// no need to continue
		plr.end();
		return;
	}

```

If all okay, fill-in the output with the data:

```
		plr.pushDatum( obj ); // one by one
		plr.pushData( [ obj1, obj2, obj3 ] ); // or as an array
```

If there are items that needed to be remove from the client's list, add theirs ids as following:

```
		plr.pushRemoveId( obj_id );
```

After filling the data array, that items will be serialized by `class-transformer`, specify its 'group' option if non-default variant is needed:

```
		plr.setSerializeGroup( 'public' )
```

Additionally some extra data (having the different structure that does not fit the main data or so) can be set along with the usual data:

```
		plr.setExtra( 'extra_data_key', extra_obj );
```

and it can be consumed on the client as such:

```
		$some_plist.extra.extra_data_key
```

Finally, call the end() method to send to the client the data that has been set with above operations.
On the client it will be handled and provided to user by the `postable_list`.

```
	export async function post(req, res, next) {
		...
		plr.end();
	} // post()
```

### ButtonPostablePost

Component to do a `post()` for a `postable_list`
