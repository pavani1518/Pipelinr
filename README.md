Pipelinr
========

Real-time visualization of big data

Project Structure
========
* Frontend
  * app
    * css (all css files of frontend project)
    * img (all image resources of frontend project)
    * js (all javascript files of frontend project)
      * app.js (provides angular modules, routes and project settings)
      * controllers.js (provides controllers for views)
      * directives.js (provides directives [components] for visualizations by d3.js)
      * filters.js (unused)
      * services.js (provides REST interfaces, business logic for controllers and websocket setup)
    * partials (all views of frontend project)
    * index.html (main file which includes external libraries and view wrapper)
    * async
  * test

* Backend
  * jobs (provides jobs for periodic execution)
  * models (schemes and models for persistence)
  * node_modules (third party libraries)
  * pipelinr_modules (own modules for data reduction, data analysis)
  * routes (REST interface of backend)
  * utils (utility functions)
  * app.js (main file which sets up http server, jobs, websockets, database events)
  * job-schedule.js (sets up jobs defined in jobs directory)
