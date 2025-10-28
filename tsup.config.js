/**
 * @type {import('tsup').Options}
 */
module.exports = {
  dts: true,
  minify: false,
  bundle: true,
  sourcemap: true,
  treeshake: true,
  splitting: false,
  clean: true,
  outDir: "dist",
  format: ["cjs", "esm"],
  entry: ["src/index.ts"],
  tsconfig: "tsconfig.node.json",
  external: ["@microsoft/teams.apps", "@microsoft/teams.common", "@microsoft/teams.dev"],
};
