import { db } from './db.ts'
import { createDexieRepositories } from './dexieRepositories.ts'
import type { Repositories } from './repositories.ts'

export const repos: Repositories = createDexieRepositories(db)
