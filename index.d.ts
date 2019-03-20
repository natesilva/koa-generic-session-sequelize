//
// TypeScript definitions for this module.
//

export = koa_generic_session_sequelize;

declare class koa_generic_session_sequelize {
  constructor(sequelize: any, options?: koa_generic_session_sequelize.Settings);
  get(sid: string): Promise<any>;
  set(sid: string, sess: any, ttl?: number): Promise<any>;
  destroy(sid: string): Promise<any>;
}

declare namespace koa_generic_session_sequelize {
  export interface Settings {
    /** name of the session table in the db */
    tableName?: string;
    /** name of the model to be registered with Sequelize */
    modelName?: string;
    /** if true, create the table if it doesn’t exist */
    sync?: boolean;
    /** if sync is true, how long to wait, in ms, for sync to complete */
    syncTimeout?: number;
    /** do garbage collection approximately every this many requests */
    gcFrequency?: number;
    /** if true, the table will have updatedAt and createdAt columns */
    timestamps?: boolean;
    /** how long to remember sessions without a TTL (sessions that only last until the browser is closed) */
    browserSessionLifetime?: number;
  }
}
