// Supabase client removed from this codebase.
// If you need a hosted SQL client, use `nextjs/lib/db.js` (Postgres) or add a new client here.
// This stub will throw if imported to make the absence explicit during development.
export const supabase = {
	_error: 'Supabase client has been removed from the repository. Use Postgres (`nextjs/lib/db.js`) or re-add Supabase intentionally.',
	from() {
		throw new Error(this._error);
	},
	rpc() {
		throw new Error(this._error);
	},
	insert() {
		throw new Error(this._error);
	},
	upsert() {
		throw new Error(this._error);
	},
	select() {
		throw new Error(this._error);
	}
};
