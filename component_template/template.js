const main = `
export default class :className extends Component {
  state = {}

  // static propTypes = {}

  render() {
    return (
      <div className=":cssClassName">
      Hello from :className
      </div>
    )
  }
}
`

const functional = `
const :className = () => (
  <div className=":cssClassName">
    Hello from :className
  </div>
)

// :className.propTypes = {
// }

export default :className
`

const container = `
export default :className
`
const reduxContainer = `

const mapStateToProps = ({ :reducerName }) => ({ :reducerName })
const mapDispatchToProps = { sampleOperation }

const componentWithReducer = withReducer(reducer, ':reducerName', { namespaceActions: false })(:className)
export default connect(mapStateToProps, mapDispatchToProps)(componentWithReducer)
`

const imports = {
  react: "import React, { Component } from 'react'",
  reactFunctional: "import React from 'react'",
  propTypes: "// import PropTypes from 'prop-types'",
  stylesheet: "import './:className.scss'",
  connect: "import { connect } from 'react-redux'",
  withReducer: "import { withReducer } from 'react-redux-dynamic-reducer'",
  reducer: "import reducer from './duck/reducer'",
  presentationalComponent: "import :className from './:className'",
  sampleOperation: "import { sampleOperation } from './duck/operations'"
}

module.exports = {
  main: main,
  imports: imports,
  functional: functional,
  container,
  reduxContainer
}
