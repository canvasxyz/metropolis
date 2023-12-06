// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import $ from "jquery"

import React from "react"
import ReactDOM from "react-dom"
import { Provider } from "react-redux"
import { BrowserRouter as Router, Route } from "react-router-dom"
import { IconContext } from "react-icons"

import { ThemeProvider } from "theme-ui"
import theme from "./theme"
import App from "./app"
import { store } from "./store"


class Root extends React.Component {
  render() {
    return (
      <ThemeProvider theme={theme}>
        <IconContext.Provider value={{ style: { position: "relative", top: "0.08em" } }}>
          <Provider store={store}>
            <Router>
              <Route render={(routeProps) => <App {...routeProps} />}></Route>
            </Router>
          </Provider>
        </IconContext.Provider>
      </ThemeProvider>
    )
  }
}

// @ts-ignore
window.$ = $

ReactDOM.render(<Root />, document.getElementById("root"))
