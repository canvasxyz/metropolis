// Copyright (C) 2012-present, The Authors. This program is free software: you can redistribute it and/or  modify it under the terms of the GNU Affero General Public License, version 3, as published by the Free Software Foundation. This program is distributed in the hope that it will be useful, but WITHOUT ANY WARRANTY; without even the implied warranty of MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the GNU Affero General Public License for more details. You should have received a copy of the GNU Affero General Public License along with this program.  If not, see <http://www.gnu.org/licenses/>.

import $ from "jquery"

import React from "react"
import { createRoot } from "react-dom/client"
import { Provider } from "react-redux"
import { BrowserRouter as Router, Route } from "react-router-dom"
import { IconContext } from "react-icons"
import "@radix-ui/themes/styles.css"
import { Theme } from "@radix-ui/themes"

import { ThemeProvider } from "theme-ui"
import theme from "./theme"
import App from "./app"
import { store } from "./store"
import { CompatRouter } from "react-router-dom-v5-compat"

class Root extends React.Component {
  render() {
    return (
      <Theme>
        <ThemeProvider theme={theme}>
          <IconContext.Provider value={{ style: { position: "relative", top: "0.08em" } }}>
            <Provider store={store}>
              <Router>
                <CompatRouter>
                  <Route
                    render={(routeProps) => {
                      return <App {...routeProps} />
                    }}
                  ></Route>
                </CompatRouter>
              </Router>
            </Provider>
          </IconContext.Provider>
        </ThemeProvider>
      </Theme>
    )
  }
}

// @ts-expect-error global jquery
window.$ = $

const container = document.getElementById("root")
const root = createRoot(container!)
root.render(<Root />)
