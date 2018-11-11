#!/usr/bin/env node
let program = require('commander')
let shell = require('shelljs')
let fs = require('fs-extra')
const replace = require('replace')
const template = require('./component_template/template')
let appName
let appDirectory
let newCompPath
let functional
let redux
program
  .version('2.0.8')
  .command('init <dir>')
  .action(createReact)
program
  .command('gc <component>')
  .option('-r, --redux', 'Connect to redux')
  .option('-f, --functional', 'Create functional component')
  .option('-s, --subcomponent <parentpath>', 'Create sub component')
  .action(createComponent)
program.parse(process.argv)
async function createReact(dir) {
  appName = dir
  appDirectory = `${process.cwd()}/${appName}`
  if (fs.existsSync(appDirectory)) {
    console.log('Directory already exists choose antother name...'.red)
    process.exit(1)
  }
  let success = await createReactApp()
  if (!success) {
    console.log('Something went wrong while trying to create a new React app using create-react-app'.red)
    process.exit(1)
  }
}
function createReactApp() {
  return new Promise(resolve => {
    if (appName) {
      console.log("\nCreating react app...".cyan)
      try {
        shell.exec(`node ${require('path').dirname(require.main.filename)}/node_modules/create-react-app/index.js ${appName} --scripts-version @ichebbi/react-scripts`, (e, stdout, stderr) => {
          if (stderr) {
            if (e == 127) {
              console.log(`create-react-app not installed \n install create-react-app first globally use :`.red)
              console.log(`npm install -g create-react-app`.white)
              resolve(false)
              process.exit(1)
            }
            resolve(true)
          } else {
            console.log("Finished creating react app".green)
            resolve(true)
          }
        })
      } catch (e) {
        console.log('create-react-app not installed'.red)
        console.log("\nInstalling create react app...".cyan)
        shell.exec(`npm install -g create-react-app`, (e, stdout, stderr) => {
          console.log("Finished installing creating react app".green)
          createReactApp()
        })
        resolve(false)
        process.exit(1)
      }

    } else {
      console.log("\nNo app name was provided.".red)
      console.log("\nProvide an app name in the following format: ")
      console.log("\ncreate-nick-react ", "app-name\n".cyan)
      resolve(false)
      process.exit(1)
    }
  })
}

async function createComponent(component, cmd, arg) {
  newCompPath = component
  cmd.functional ? functional = true : functional = false
  cmd.redux ? redux = true : redux = false

  if (cmd.redux && cmd.subcomponent) {
    console.log('You can\'t create a connect subcomponent '.red)
    process.exit(1)
  }

  if (cmd.subcomponent && !fs.existsSync(`./src/components/${cmd.subcomponent}`)) {
    console.log(`${cmd.subcomponent} does not exist`.red)
    process.exit(1)
  }

  if (fs.existsSync('./src/components')) {
    newCompPath = cmd.subcomponent ? `./src/components/${cmd.subcomponent}/subcomponents/${component}` : `./src/components/${component}`
  }
  // let template = await buildTemplate()
  const presentationalTemplate = buildPresentationalTemplate()
  const containerTemplate = buildContainerTemplate()
  await writeFile(presentationalTemplate, containerTemplate, component)
}

function buildPresentationalTemplate() {
  const imports = [
    functional ? template.imports.reactFunctional : template.imports.react,
    template.imports.propTypes,
    template.imports.stylesheet
  ]

  const body = functional ? [template.functional] : [template.main]
  return imports.join('\n') + '\n' + body
}

function buildContainerTemplate() {
  if (redux) {
    const imports = [
      template.imports.connect,
      template.imports.withReducer,
      '',
      template.imports.reducer,
      template.imports.sampleOperation,
      template.imports.presentationalComponent
    ]
    return imports.join('\n') + template.reduxContainer
  } else {
    return template.imports.presentationalComponent + '\n' + [template.container].join('\n')
  }
}

function capitalize(comp) {
  return comp[0].toUpperCase() + comp.substring(1, comp.length)
}
async function writeFile(presentationalTemplate, containerTemplate, component) {
  let path = newCompPath

  let comp = component.split('/')
  comp = comp[comp.length - 1]
  let presentationalPath
  let containerPath
  if (path) {
    presentationalPath = path + '/' + capitalize(comp)
    containerPath = path + '/index'
  } else {
    presentationalPath = capitalize(comp)
  }

  //create stylesheet
  if (!fs.existsSync(`${presentationalPath}.scss`)) {
    console.log('creating syles')
    fs.outputFileSync(`${presentationalPath}.scss`, '')
    console.log(`Stylesheet ${comp} created at ${presentationalPath}.scss`.cyan)
  } else {
    console.log(`Stylesheet ${comp} allready exists at ${presentationalPath}.scss, choose another name if you want to create a new stylesheet`.red)
  }

  if (redux) {
    await new Promise(resolve => {
      fs.copySync(`${require('path').dirname(require.main.filename)}/component_template/duck`, `${path}/duck`)
      resolve()
    })
  }

  writeTemplate(presentationalTemplate, presentationalPath, 'jsx')
  writeTemplate(containerTemplate, containerPath, 'js')

  function writeTemplate(template, path, extension) {
    if (!fs.existsSync(`${path}.${extension}`)) {
      fs.outputFile(`${path}.${extension}`, template, (err) => {
        if (err)
          throw err
        replace({
          regex: ':className',
          replacement: capitalize(comp),
          paths: [`${path}.${extension}`],
          recursive: false,
          silent: true,
        })
        if (redux)
          replace({
            regex: ':reducerName',
            replacement: comp,
            paths: [`${path}.${extension}`],
            recursive: false,
            silent: true,
          })
        console.log(`Component ${comp} created at ${path}.${extension}`.cyan)
      })
    }
    else {
      console.log(`Component ${comp} allready exists at ${path}.${extension}, choose another name if you want to create a new component`.red)
    }
  }
}

