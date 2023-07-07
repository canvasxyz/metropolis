(defproject io.pubhouse/pubhouse "1.0.0-SNAPSHOT"
  :description "A sample project"
  :url "http://github.com/pubhouse/pubhouse"
  :plugins [[lein-dotenv "1.0.0"]]
  :min-lein-version "2.0.0"
  :dependencies [[org.clojure/clojure "1.11.1"]
        [org.clojure/spec.alpha "0.3.218"]
        [org.clojure/core.async "1.6.673"]
        [org.clojure/data.csv "1.0.1"]
        [org.clojure/math.numeric-tower "0.0.5"]
        [org.clojure/core.match "1.0.1"]
        [org.clojure/tools.namespace "1.3.0"]
        [org.clojure/tools.logging "1.2.4"]
        [org.clojure/tools.trace "0.7.11"]
        [org.clojure/tools.reader "1.3.6"]
        [org.flatland/ordered "1.15.10"]
        ;; Other stuff
        [commons-collections/commons-collections "20040616"]
        [cheshire/cheshire "5.11.0"]
        [com.taoensso/timbre "5.2.1"]
        [com.taoensso/encore "3.23.0"]
        ;; Troublesome carmine... was using this for simulation stuff
        ;[com.taoensso/carmine "2.7.0" :exclusions [org.clojure/clojure]]
        ;; Updates; requires fixing index conflict between named-matrix and core.matrix
        [net.mikera/core.matrix "0.63.0"]
        [net.mikera/vectorz-clj "0.48.0"]
        ;[net.mikera/core.matrix "0.23.0"]
        [net.mikera/core.matrix.stats "0.7.0"]
        [criterium/criterium "0.4.6"]
        [clj-http/clj-http "3.12.3"]
        ;; We should be able to switch back to this now that we aren't using storm
        [org.clojure/tools.cli "1.0.214"]
        ;; implicitly requires jetty, component and ring
        [ring/ring-core "1.9.6" :exclusions [clj-time/clj-time]]
        [ring-jetty-component/ring-jetty-component "0.3.1" :exclusions [clj-time/clj-time]]
        [ring-basic-authentication/ring-basic-authentication "1.1.1"]
        [ring/ring-ssl "0.3.0"]
        [bidi/bidi "2.1.6" :exclusions [prismatic/schema]]
        ;; Taking out storm cause yeah...
        ;[org.apache.storm/storm-core "0.9.2-incubating"]
        ;; Can't find bouncycastle trying to use this
        ;[incanter "1.9.3" :exclusions [org.clojure/clojure]]
        [bigml/sampling "3.2"]
        [com.cognitect.aws/api "0.8.641"]
        [com.cognitect.aws/endpoints "1.1.12.398"]
        [com.cognitect.aws/s3 "825.2.1250.0"]

        [org.postgresql/postgresql "42.5.2"]
        [korma/korma "0.4.3"]
        [clj-time/clj-time "0.15.2"]
        ;[clj-excel "0.0.1"]
        [semantic-csv/semantic-csv "0.2.0"]
        ;[dk.ative/docjure "1.13.0"]
        [prismatic/plumbing "0.6.0"]
        [environ/environ "1.2.0"]
        [lein-dotenv "1.0.0"]
        [mount/mount "0.1.17"]
        [honeysql/honeysql "1.0.461"]
        ;; Dev
        [org.clojure/test.check "1.1.1"]
        [irresponsible/tentacles "0.6.9"]
        [techascent/tech.ml.dataset "6.104"]]
  :repositories [["clojars.org" "https://repo.clojars.org"]]
  :main polismath.runner
  :aliases {"poller" ["run"]}
  :source-paths ["math/src"]

  ;; TODO: reboot the math worker every 14400 sec (4 hours)
)