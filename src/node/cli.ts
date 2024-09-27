import { cac } from 'cac';
import path from 'path';
import { version } from './../../package.json';
import { build } from './build';

const cli = cac('island').version(version).help();

cli
  .command('build [root]', 'build for production')
  .option('--output [path]', 'output directory')
  .option('--vercel', '[boolean] build for vercel')
  .action(async (cwd: string = process.cwd(), opts: { output: string, vercel: boolean }) => {
    const root = path.resolve(cwd);
    try {
      await build(root, opts);
    } catch (error) {
      console.error(error);
      process.exit(1);
    }
  });

export { cli };
