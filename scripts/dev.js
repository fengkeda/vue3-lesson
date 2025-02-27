// 这个文件会帮我们打包packages下的模块，最终打包出js文件

// node dev.js 要打包的名字 -f 打包的格式

import minimist from "minimist";
import { fileURLToPath } from "url";
import { resolve, dirname } from "path";
import { createRequire } from "module";
import esbuild from "esbuild";

// esm使用commonjs变量
const args = minimist(process.argv.slice(2));
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);
// 打包哪个项目，比如reactivity
const target = args._[0] || "reactivity";
const format = args.f || "iife"; // 打包后的模块化规范

// 入口文件，根据命令行提供的路径进行解析
const entry = resolve(__dirname, `../packages/${target}/src/index.ts`);

// 出口文件
const outfile = resolve(__dirname, `../packages/${target}/dist/${target}.js`);
const pkg = require(`../packages/${target}/package.json`);

// 打包配置
esbuild
  .context({
    entryPoints: [entry], // 入口文件
    outfile,
    bundle: true, // 打包成一个文件
    platform: "browser", // 打包成浏览器环境可用的代码
    sourcemap: true, // 生成sourcemap文件，方便调试
    format, // 打包后的模块化规范 cjs esm iife
    globalName: pkg.buildOptions?.name,
  })
  .then((ctx) => {
    console.log("build success");

    return ctx.watch(); // 监控入口文件的变化，自动重新打包
  });
