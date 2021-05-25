import { promises as fs } from 'fs';
import { parse, stringify } from 'ini';
import { join } from 'path';
import * as z from 'zod';
import { configDir, ensureFolderExists, filter, loadFile } from './utils';

export const log = <T>(x: T): T => (console.log(x), x);

export const Config = z.object({
	baseURL: z.string(),
	renewTime: z.number(),
	token: z.string().optional()
});

export type Config = z.infer<typeof Config>;

const defaultConfig: Config = {
	baseURL: 'https://dashboard.metacall.io',
	renewTime: 1000 * 60 * 60 * 24 * 15
};

const defaultPath = configDir(join('metacall', 'deploy'));

const configFilePath = (path = defaultPath) => join(path, 'config.ini');

export const load = async (path = defaultPath): Promise<Config> => {
	const data = parse(
		await loadFile(configFilePath(await ensureFolderExists(path)))
	);
	return Config.nonstrict().parse({
		...defaultConfig,
		...data,
		...(data.renewTime ? { renewTime: Number(data.renewTime) } : {})
	});
};

export const save = async (
	data: Partial<Config>,
	path = defaultPath
): Promise<void> =>
	fs.writeFile(
		configFilePath(await ensureFolderExists(path)),
		stringify(
			filter(defaultConfig, {
				...(await load(path)),
				...data
			})
		)
	);
