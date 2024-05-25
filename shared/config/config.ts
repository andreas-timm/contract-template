// config v2.0.0
import { readFileSync, writeFileSync, existsSync, statSync, utimesSync, mkdirSync } from 'node:fs'
import { load } from 'js-yaml'
import Ajv from 'ajv'
import * as tsj from 'ts-json-schema-generator'
import path from 'node:path'
import deepmerge from 'deepmerge'
import { Config } from './data'

const DEFAULT_CONFIG_PATH = 'config.yaml'
const DEFAULT_INTERFACE_PATH = 'shared/config/data.ts'
const DEFAULT_CACHE_DIR = 'node_modules/.cache/config'
const DEFAULT_CACHE_SCHEMA_PATH = `${DEFAULT_CACHE_DIR}/schema.json`
const DEFAULT_TSCONFIG_PATH = 'tsconfig.json'

const ajv = new Ajv({ strictDefaults: true, allErrors: true })

function getCached(cachePath: string, mtimeMs?: number): Record<string, any> | null {
    let is_exists = existsSync(cachePath)
    if (mtimeMs !== undefined) {
        is_exists &&= statSync(cachePath).mtimeMs == mtimeMs
    }

    if (is_exists) {
        return JSON.parse(readFileSync(cachePath).toString('utf-8'))
    }

    return null
}

function writeToCache(cachePath: string, data: Record<string, any>, configDMDate?: Date) {
    const dataString = JSON.stringify(data)
    const cacheDir = path.dirname(cachePath)
    if (!existsSync(cacheDir)) {
        mkdirSync(cacheDir, { recursive: true })
    }
    writeFileSync(cachePath, dataString)

    if (configDMDate !== undefined) {
        utimesSync(cachePath, configDMDate, configDMDate)
    }
}

function getSchema(/*data: any*/) {
    let schema: any

    let cached = getCached(DEFAULT_CACHE_SCHEMA_PATH, statSync(DEFAULT_INTERFACE_PATH).mtimeMs)
    if (cached !== null) {
        return cached as Config satisfies Config
    }

    const config = {
        path: DEFAULT_INTERFACE_PATH,
        tsconfig: DEFAULT_TSCONFIG_PATH,
        type: 'Config',
    }
    schema = tsj.createGenerator(config).createSchema(config.type)

    writeToCache(DEFAULT_CACHE_SCHEMA_PATH, schema, new Date(statSync(DEFAULT_INTERFACE_PATH).mtimeMs))

    return schema
}

export function configValidate(data: any) {
    const schema = getSchema(/*data*/)
    const validate = ajv.compile(schema)

    if (!validate(data)) {
        const validateMessages = validate.errors
            ?.map((i) => `  • ${i.message}: ${JSON.stringify(i.params)} (${i.schemaPath})`)
            .join('\n')
        throw new Error(`Config:\n${validateMessages}`)
    }
}

// TODO: workaround due to bun issues:
// - https://github.com/oven-sh/bun/issues/7584
// - https://github.com/oven-sh/bun/issues/7630
// - https://github.com/oven-sh/bun/issues/4746
// TODO: replace after a fix "getGSMConfigFromManager"
// noinspection JSUnusedGlobalSymbols
export async function getGSMConfig(config: Config): Promise<Record<string, any> | null> {
    if (!config.config.gsm || config.config.gsm.secret == '') {
        return null
    }

    // prettier-ignore
    const proc = Bun.spawn([
        'gcloud', `--project=${config.config.gsm.project}`,
        'secrets', 'versions', 'access', 'latest',
        `--secret=${config.config.gsm.secret}`,
    ])
    const content = await new Response(proc.stdout).text()
    return JSON.parse(content)
}

// // TODO: remove "noinspection" after the fix
// // noinspection JSUnusedLocalSymbols
// async function getGSMConfigFromManager(config: Config) {
//   if (config.config.gsm.secret == '') {
//     return config
//   }
//
//   const client = new SecretManagerServiceClient({})
//   const [res] = await client.accessSecretVersion({
//     name: `projects/${config.config.gsm.project}/secrets/${config.config.gsm.secret}/versions/latest`,
//   })
//
//   return res.payload && res.payload.data ? deepmerge(config, JSON.parse(res.payload.data.toString())) : config
// }

export function getData(configPaths: string[]) {
    const contents = configPaths
        .filter((p) => existsSync(p))
        .map((configPath) => readFileSync(configPath).toString('utf-8'))
    return contents.reduce((acc, content) => deepmerge(acc, load(content) as object), {}) as Config
}

export function getConfig(configPaths: string[] = [], initData: {} = {}): Config {
    const cached = getCached(`${DEFAULT_CACHE_DIR}/data.json`)
    if (cached !== null) {
        return cached as Config
    }

    // TODO: remove "noinspection" after the fix
    // noinspection JSUnusedLocalSymbols

    if (configPaths.length == 0) {
        configPaths.push(DEFAULT_CONFIG_PATH)
    }

    let data = deepmerge(initData, getData(configPaths)) as Config
    if (data.config?.added?.length > 0) {
        data = deepmerge(data, getData(data.config.added))
    }

    data.debug = process.env.DEBUG === 'true'

    if (data.debug) {
        console.log('🚧 config:', data)
    }

    configValidate(data)

    writeToCache(`${DEFAULT_CACHE_DIR}/data.json`, data)

    return data
}
