#!/usr/bin/env node

const { Command, Option } = require("commander")
const path = require("path")
const {
  name,
  version
} = require("../package.json");

const program = new Command()
program.name(name).description("Utility for building and serving statically generated CanJS pages").version(version)

program
  .command("build")
  .description("Create a static site build of a CanJS application")
  .option("-e, --environment <string>", "which environment to build from ssg.json", "dev")
  .option("-m, --main <string>", "path to the steal main for building SSG mode", "~/app/app.ssgjs")
  .option("-c, --config-path <string>", "path to the steal config file", "package.json!npm")
  .option("-d, --dest <string>", "root of the output tree for production builds", "./prod")
  .action((str, options) => {
    const ssg = require(`../generate/${options.opts().environment}`)
    const opts = options.opts();
    ssg(opts)
  })

program
  .command("serve")
  .description("Start a Web server that will serve pages and assets for a statically built site")
  .option("-e --environment <string>", "which build environment to serve", "dev")
  .option("-m --main <string>", "path to the steal main for serving SSG mode", "~/app/app.ssgjs")
  .option("-d --dist <string>", "root of the build distribution for production mode", "./prod")
  .addOption(new Option("-p --port <number>", "port number to serve on", 8080).env("PORT"))
  .action((str, options) => {
    const server = require(`../serve/${options.opts().environment}-spa`)
    server(options.opts())
  })

program.parse()
