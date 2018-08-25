---
path: "/blog/super-rentals-2"
date: "2017-10-01"
title: Connecting Express to CosmosDB (Part II)
tags: "Express,Azure"
---

Following the last post, we will connect our Express service to the Azure CosmosDB database and point our EmberJS client to use the service.

Related: [Part 1]({{ site.baseurl }}/Super-Rentals/)

From the [first post]({{ site.baseurl }}/Super-Rentals/), we should have a working client, an Azure Cosmos DB service, and a basic Express app with the /api/rentals API defined. Our big picture is to have the EmberJS client calling our Express "front door," which queries the database for our desired data. 

We left off with the Ember app receiving mock data from controller of the Express service. The next step is to remove the mock data and to query data directly from the database.

## Azure config

First create a helper class with our database config data. This is just to hold our secret key for interacting with the database.

Let's create the file api/helpers/azureConfig.js

    'use strict';

    var azureConfig = {}

    azureConfig.host = process.env.HOST || "[the URI value from the Azure Cosmos DB Keys blade on http://portal.azure.com]";
    azureConfig.authKey = process.env.AUTH_KEY || "[the PRIMARY KEY value from the Azure Cosmos DB Keys blade on http://portal.azure.com]";
    azureConfig.databaseId = "super-rentals";
    azureConfig.collectionId = "Items";

    module.exports = azureConfig;

Navigate to the the azure portal and the CosmosDB service we created. Pull out the host URI and the primary key values, then update the azureConfig.js with your values.

<img src="{{ site.baseurl }}/images/super-rentals-keys.PNG" alt="Access keys from settings"/>

Don't check the secret key into git, especially if it is going to be public. With the key, anyone could access your database! If you make a mistake and it does become public, you can refresh to a new key through the portal. After check in, even if you were to remove it in a future commit, it will stay in your history, so be very careful when interacting with your keys.

## Document utilities

Grab the the Azure DocumentDB npm package. This provides a simplified way to interact with the database.

    npm install documentdb

We are going to create another helper class to help us access the database. There are two methods - one to get the database instance, and a second to get a collection. You can find more robust cases in the [documentdb documentation](https://docs.microsoft.com/en-us/azure/cosmos-db/documentdb-nodejs-application).

Create *api\helpers\docdbutils.js* with the following:

    var DocumentDBClient = require('documentdb').DocumentClient;

    var DocDBUtils = {
        getDatabase: function (client, databaseId, callback) {
            let querySpec = {
                query: 'Select * FROM root r WHERE r.id= @id',
                parameters: [{
                    name: '@id',
                    value: databaseId
                }]
            };
            client.queryDatabases(querySpec).toArray(function (err, results) {
                if (err) {
                    callback(err);
                } else {
                    if (results.length === 0) {
                        callback(null) //todo: pass err
                    } else {
                        callback(null, results[0]);
                    }
                }
            })
        },

        getCollection: function (client, databaseLink, collectionId, callback) {
            var querySpec = {
                query: 'Select * FROM root r WHERE r.id=@id',
                parameters: [{
                    name: '@id',
                    value: collectionId
                }]
            };

            client.queryCollections(databaseLink, querySpec).toArray(function (err, results) {
                if (err) {
                    callback(err);
                } else {
                    if (results.length === 0) {
                        callback(null); //todo: pass err
                    } else {
                        callback(null, results[0]);
                    }
                }
            });
        }
    }

    module.exports = DocDBUtils;

In both methods, we first defined a query for the target object, and then use the provided DocumentDBClient instance to invoke the query. 

Next, we'll create a second helper to use the database object to query rental-related data. This is what our controller(s) will call into to initialize the connection and perform queries. Create *api/helpers/RentalDao.js*.

    var DocumentDBClient = require('documentdb').DocumentClient;
    var docdbUtils = require('./docdbUtils');
    var azureConfig = require('./azureConfig');

    var docDbClient = new DocumentDBClient(azureConfig.host, {
        masterKey: azureConfig.authKey
    });

    var RentalDao = {
        client: docDbClient,
        databaseId: azureConfig.databaseId,
        collectionId: azureConfig.collectionId,
        
        database: null,
        collection: null,

        init: function () {
            var self = this;

            return new Promise((resolve, reject) => {
                docdbUtils.getDatabase(self.client, self.databaseId, function (err, db) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    self.database = db;
                    docdbUtils.getCollection(self.client, self.database._self, self.collectionId, function(err, coll) {
                        if (err) {
                            reject(err);
                            return;
                        }
                        self.collection = coll;
                        resolve();
                    })
                });
            });
        },

        find: function (querySpec) {
            var self = this;

            return new Promise((resolve, reject) => {
                self.client.queryDocuments(self.collection._self, querySpec).toArray(function (err, results) {
                    if (err) {
                        reject(err);
                        return;
                    }
                    results.forEach(function(rental, index) {
                        delete rental._rid;
                        delete rental._self;
                        delete rental._etag;
                        delete rental._attachments;
                        delete rental._ts;
                    });
                    resolve({data: results});
                })
            });
        }
    };

    module.exports = RentalDao;

This code uses Promises, which are the asynchronous hotness. Once we've successfully retrieved data, we invoke `resolve` with the result. In case of error, we `reject`.

`Init` initializes the connection to the database. This is called once on program start to set up everything we need. This isn't super robust, since the database going offline would lead to problems, but it works for our purpose.

When we added our mock data to the Azure database, the DocumetnDB format added some new fields for its own use. These extra fields are '_rid', '_self', etc. They are not part of our original data (or our swagger schema). If we leave them in, they'll be returned down to the client callers. This probably won't lead to any harm, but are not part of our contract, so we will delete these values from the results.

One other note is that the data returned does not follow JSONApi format. It is *close*, but is missing the 'data' wrapper around the return. Therefore, we include a 'data' wrapper before returning from the controller.

## Database init

We need logic in our app.js to instantiate the database connection. Crack open the file and you'll see that Swagger has some instantiation code that exists for registration and starting the server (app.listen).

We don't want any users coming in before the database connection is finished, so we ensure to block until completion. Since we use Promises in RentalDao, we can use `.then` to block in *app.js*.

    'use strict';

    var SwaggerExpress = require('swagger-express-mw');
    var app = require('express')();
    module.exports = app; // for testing

    var config = {
        appRoot: __dirname // required config
    };

    var RentalDao = require('./api/helpers/rentalDao.js');

    SwaggerExpress.create(config, function(err, swaggerExpress) {
        if (err) { throw err; }

        // setup database access object
        RentalDao.init().then(function() {
            
            // install middleware
            swaggerExpress.register(app);
        
            var port = process.env.PORT || 10010;
            app.listen(port);

        }).catch( (err) => {
            console.log(err);
        });
    });

The last piece for our Express service is to wire RentalDao through the controller. First, remove our mock data we had previously added, and lets expand `getAll` so that it calls `rentalDao.find()` for our data. Remember that if the query parameter 'city' is provided, we need to filter to just those that start with the provided string. It's possible the query below could work without the condition, try to improve on it!

Note: If you are working on your own query, an easy way to debug is to test through the 'Query Explorer' on your Azure Cosmos DB Account portal.  

    'use strict';

    var rentalDao = require('../helpers/rentalDao.js');

    module.exports = { getAll };

    // Get /rental operationId
    function getAll(req, res, next) {
        let querySpec = null;
        let city = req.query.city;

        if (city) {
            querySpec = {
                query: 'SELECT * FROM root r WHERE STARTSWITH(LOWER(r.attributes.city), LOWER(@city))',
                parameters: [{
                    name: '@city',
                    value: city
                }]
            };
        } else {
            querySpec = {
                query: 'SELECT * FROM root r'
            };
        }

        return rentalDao.find(querySpec)
            .then( (results) => {
                res.json( results );  
            }).catch( (err) => {
                throw (err);  
            });
    }

Fun fact: Our filter query could have some issues if we were to support Turkish. (See the [Turkish I issue](https://blogs.msdn.microsoft.com/qingsongyao/2009/02/13/introduce-the-turkish-i-issue/)). 

That is all we need! Make sure it is running locally and test the API through your browser or the Swagger editor. Calling /api/rentals should return all the mock data in the Azure database. Calling /api/rentals?city=Sea will return all rentals whose city begins with 'Sea' (so Seattle). Play around and see if everything works as we expect.

## Pointing EmberJS to the local service

Now that the Express service is running locally, the EmberJS client can point to it to pull data with some easy changes.

In the EmberJS project, modify the existing JSONApiAdapter to use the new host. In this case our host is just http://localhost:10010/. The file *app/adapters/application.js* becomes

    import DS from 'ember-data';

    export default DS.JSONAPIAdapter.extend({
        namespace: 'api',
        host: 'http://localhost:10010'
    });

One other quick change is to disable *mirage* in our dev enviornment. This makes our debug builds actually go out to the server instead of using mock data.

In *app/config/enviornment.js*, add the following:

    if (environment === 'development') {
            ENV['ember-cli-mirage'] = {
            enabled: false
        }
    }

Try loading your EmberJS app. Any errors will come up in the console. When everything is working, it should behave the same way as if you were using mocks, but you're not! Your request is going from the client, through your Express service, and to the database.

If you aren't sure whether the call is hitting mirage or not, an easy test is to use your favorite network sniffer (like Fiddler) and check for the network call.

<img src="{{ site.baseurl }}/images/super-rentals-fiddler-localhost.PNG" alt="Fiddler sniffle example"/>

## Next time

In the next post we'll be going over pushing our Express service and EmberJS client out to the real world. We'll set up services in Azure and go through deployment.