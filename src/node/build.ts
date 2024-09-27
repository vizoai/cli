import fs from 'fs-extra'
import path from 'path'
// @ts-ignore
import ncc from '@vercel/ncc';

type VercelRuntime = "node" | "edge";

export interface BuildOptions {
  output: string;
  vercel: boolean;
  entry: string;
  root: string;
  staticDir: string;
}

class Builder {
  constructor(private root: string, private opts: Omit<BuildOptions, 'root'>) {
    this.root = root;
    this.opts = opts;
  }

  async build() {
    const configJson = {
      version: 3,
      trailingSlash: false,
      routes: [
        {
          src: ".*",
          dest: "_serverless",
        },
      ] as any[],
      overrides: {},
    };

    const vcConfig = {
      edge: {
        runtime: "edge",
        entrypoint: "index.js",
      },
      node: {
        runtime: "nodejs20.x",
        handler: "index.js",
        launcherType: "Nodejs",
      },
    } satisfies Record<VercelRuntime, object>;

    const bundleName = 'index.js';
    const targetPath = this.opts.vercel ? path.join(this.root, '.vercel/output/functions/_serverless.func') : this.opts.output;
    fs.removeSync(targetPath);
    fs.ensureDirSync(targetPath);
    fs.copySync(this.opts.staticDir, path.join(this.root, ".vercel/output/static"), { overwrite: true });
    const { code, assets } = await ncc(path.join(this.root, this.opts.entry), {
      minify: false,
      // sourceMap: true,
      sourceMap: false,
      out: targetPath,
      cache: true,
      externals: [],
      assetsBuilds: false,
    });

    // copy assets
    for (const assetKey of Object.keys(assets)) {
      const asset = assets[assetKey];
      const data = asset.source;
      const fileTarget = path.join(targetPath, assetKey);
      fs.ensureDirSync(path.dirname(fileTarget));
      fs.writeFileSync(fileTarget, data);
    }

    // write code to package
    const outfile = path.join(targetPath, bundleName);
    fs.ensureDirSync(path.dirname(outfile));
    fs.writeFileSync(path.join(targetPath, bundleName), code, 'utf-8');

    if (process.env.VERCEL || this.opts.vercel) {
      const vercelOutput = path.join(this.root, '.vercel/output');
      fs.mkdirSync(vercelOutput, { recursive: true });
      fs.mkdirSync(path.join(vercelOutput, "functions/_serverless.func"), { recursive: true });
      fs.writeJsonSync(path.join(vercelOutput, 'functions/_serverless.func/.vc-config.json'), vcConfig['node'], {
        spaces: 2,
        encoding: 'utf-8',
      });
      configJson.routes.unshift({
				handle: "filesystem",
      })
      fs.writeJsonSync(path.join(vercelOutput, 'config.json'), configJson, {
        spaces: 2,
        encoding: 'utf-8',
      });
    }
    console.log('build success');
  }
}

export async function build(opts: BuildOptions) {
  const config: BuildOptions = {
    ...opts,
    staticDir: path.resolve(opts.staticDir),
    root: opts.root,
    output: path.resolve(opts.output ?? 'dist'),
    vercel: opts.vercel ?? process.env.VERCEL ?? false,
    entry: opts.entry,
  }
  const builder = new Builder(config.root, config);
  await builder.build();
}
