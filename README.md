# mookuauhau-backend + gedcomloader

Backend code repository for the Moʻokūʻauhau project

- [Hasura](https://hasura.io/) setup w/PostgreSQL migrations
- [GEDCOM](https://github.com/tmcw/gedcom) file loader (command line)
- optional JWT auth connected to mookuauhau.owner_id (developing first using [Nhost.io](https://nhost.io) [Hasura Auth](https://github.com/nhost/hasura-auth/))

# Overview

The kuleana for the mookuauhau-backend project repository is:

- Provide a data store for genealogy data
- Make the data available via a GraphQL API for various frontend visualization UI/UX
- Load GEDCOM file(s) into the data store
- Allow for future security permissions integrations
- Allow for possible private instances, or also multi-tenant dataset in the same database.

We have a core implementation available for use in the Hawaiians in Tech 2022 Hackathon, but which could be a base for future work.

Backend tech stack:

- Hasura GraphQL engine
- PostgreSQL relational db
- NodeJS TypeScript GEDCOM file loader via graphql api

These may be run against either local instances running in Docker containers, or else run against hosted instances ( Hasura Cloud, Nhost.io, etc. )

Alternatively, Neo4j can be used as an alternative backend, for schemaless graph database. It has more built-in data visualization tools, but is more reliant on the Cypher query language.


# Hasura Cloud hosting

The cloud instance is managed using the same Hasura migrations+metadata. 

Development on db schema and hasura metadata is done in local instances, 
and promoted to production hosting when ready. 

# Running Locally (hasura graphql engine + postgresql in docker)

To run Moʻokūʻauhau backend locally, first get your .env file in order:
```sh
cp .env.example .env
```

Then start up local docker containers:
```sh
docker compose up
```

This will spin up a local hasura graphql engine + postgresql database.

Nohea expects most backend devs will be good with this, as it allows for testing 
database and graphql metadata, migrations, without the need for messing with users. 

For the hackathon, we can use the shared users on our nhost.io instance. 

The following endpoints are now exposed (based on your .env):
- `http://localhost:8089`: Hasura Console (password is password)
- `http://localhost:8089/v1/graphql`: Hasura GraphQL endpoint
- `localhost:5413`: PostgreSQL

# Running Locally (hasura graphql engine + postgresql + nhost auth and nhost storage in docker)

To run Moʻokūʻauhau backend (hasura graphql engine + postgresql + nhost auth and nhost storage) locally:

```sh
docker compose -f ./docker-compose-neo4j.yaml up
```

This will spin up a local nhost environment and a neo4j database.

The following endpoints are now exposed:
- `http://localhost:1337`: Hasura Console (password is password)
- `http://localhost:1337/v1/graphql`: Hasura GraphQL endpoint
- `http://localhost:1337/v1/auth`: Hasura Auth
- `http://localhost:1337/v1/storage`: Hasura Storage
- `http://localhost:1337/v1/functions`: Functions

- `http://localhost:9090`: Traefik dashboad
- `http://localhost:8025`: Mailhog SMTP testing dashboard

# Running Locally Neo4j graphdb (docker)

This will spin up a Neo4j instance.

Use this as an alternative backed, for schemaless work. 

## Reset Docker

To reset docker compose run:

```sh
# stop all containers, remove orphans, and remove volumes
docker compose down -v --remove-orphans

# remove the local data folder
rm -fr data

# re-run the first-time setup written above
```

## Tests within docker

To test the application run:

```sh
# test neo4j
docker compose run --rm api npm run t4j

# test graphql
docker compose run --rm api npm run tgql
```


# system architecture

We are actually supporting 2 backends, for different purposes.

## Hasura graphql engine - long-term platform

![software architecture diagram](static/moʻokūʻauhau-backend-diagram.png?raw=true)

## Neo4j - Rapid Data Visualization backend (schemaless)

![software architecture diagram](static/moʻokūʻauhau-neo4j-backend-diagram.png?raw=true)

# database schema

![database schema diagram](static/mookuauhau-erd.png?raw=true)

# Usage

## load a GEDCOM file on command line

```
npm run load ../gedcom/mookuauhau.ged
```

When the 'load' script is run:

- runs the 'parse-gedcom' parse() on it to AST object
- sends the AST object to a transform() function to map to genealogy objects
- objects process to the configured 'mutations' adapter: 'graphql', 'neo4j', or 'mock'.
- creates mookuauhau, kanaka, ohana, kamalii records from the objects.

## load a GEDCOM file which was loaded to the backend queue, in `mookuauhau.load_status == 'new'`

```
npm run queueload
```

Note: queue load requires Nhost backend, and the file is uploaded using the [demo-mookuauhau-adminlite](https://github.com/hawaiiansintech/demo-mookuauhau-adminlite) web app.

- The user registers/logs into the admin ui,
- uploads a GEDCOM file (stored on Nhost storage)
- a 'mookuauhau' record is created, with owner_id set to the Nhost user_id, with load_status == 'new'

When the 'queueload' script is run:

- reads the next mookuauhau record w/load_status == 'new'
- updates mookuauhau.load_status = 'loading'
- downloads the corresponding GEDCOM file from Nhost storage
- runs the 'parse-gedcom' parse() on it to AST object
- sends the AST object to a transform() function to map to genealogy objects
- objects process to the configured 'mutations' adapter: 'graphql', 'neo4j', or 'mock'.
- creates kanaka, ohana, kamalii records from the objects.
- updates mookuauhau.load_status = 'done'

## query one person by xref_id, return relations

- main query is an individual person
- makuahine means this kanaka is a mother in an ʻohana relationship
- makuakane means this kanaka is a father in an ʻohana relationship
- nakamalii is a list of children of this kanaka (ʻohana relationship)
- namakua is a list of makua/parents this kanaka is a child of (other ʻohana relationships)

```
query kanakaByXrefidRelations($xref_id: String!) {
  kanaka(where: {xref_id: {_eq: $xref_id}}) {
    kanaka_id
    name
    sex
    residence
    xref_id
    mookuauhau_id
    namakua {
      ohana {
        ohana_id
        xref_id
        kane_id
        wahine_id
        kane {
          kanaka_id
          xref_id
          name
        }
        wahine {
          kanaka_id
          xref_id
          name
        }
        residence
        residence_place
      }
    }
    makuakane {
      ohana_id
      xref_id
      kane_id
      wahine {
        kanaka_id
        name
        xref_id
      }
      nakamalii {
        kamalii_id
        ohana {
          ohana_id
          xref_id
        }
        kanaka {
          kanaka_id
          name
          xref_id
          sex
        }
      }
    }
    makuahine {
      ohana_id
      xref_id
      wahine_id
      kane {
        kanaka_id
        name
        xref_id
      }
      nakamalii {
        kamalii_id
        kanaka {
          kanaka_id
          name
          xref_id
          sex
        }
      }
    }
    birth_date
    birth_date_dt
    birth_place
    death_date
    death_date_dt
    death_place
    burial_place
    formal_name
    name_aka
    name_surname
    residence_place
    source_uid
  }
}
```

parameters:

```
{"xref_id": "@I247@"}
```

result:

```
{
  "data": {
    "kanaka": [
      {
        "kanaka_id": 347,
        "name": "Mary Punapanawea /Adams/",
        "sex": "F",
        "residence": null,
        "birth_date": "28 Feb 1838",
        "birth_place": "Niu Hawaii",
        "xref_id": "@I247@",
        "mookuauhau_id": 101,
        "namakua": [
          {
            "ohana": {
              "ohana_id": 307,
              "xref_id": "@F207@",
              "kane_id": 328,
              "wahine_id": 342,
              "kane": {
                "kanaka_id": 328,
                "xref_id": "@I228@",
                "name": "Alexander /Adams/"
              },
              "wahine": {
                "kanaka_id": 342,
                "xref_id": "@I242@",
                "name": "Sarah Ulukaihonua /Harbottle/"
              }
            }
          }
        ],
        "makuakane": [],
        "makuahine": [
          {
            "ohana_id": 318,
            "xref_id": "@F218@",
            "wahine_id": 347,
            "kane": {
              "kanaka_id": 340,
              "name": "William /Auld/",
              "xref_id": "@I240@"
            },
            "nakamalii": []
          },
          {
            "ohana_id": 320,
            "xref_id": "@F220@",
            "wahine_id": 347,
            "kane": {
              "kanaka_id": 459,
              "name": "Edwin Harbottle /Boyd/",
              "xref_id": "@I359@"
            },
            "nakamalii": [
              {
                "kamalii_id": 502,
                "kanaka": {
                  "kanaka_id": 350,
                  "name": "Mary Euphrozine Hio /Boyd/",
                  "xref_id": "@I250@",
                  "sex": "F"
                }
              },
              {
                "kamalii_id": 503,
                "kanaka": {
                  "kanaka_id": 503,
                  "name": "James Aalapuna  Harbottle /Boyd/",
                  "xref_id": "@I403@",
                  "sex": "M"
                }
              },
              {
                "kamalii_id": 504,
                "kanaka": {
                  "kanaka_id": 464,
                  "name": "Edward Strehz /Boyd/",
                  "xref_id": "@I364@",
                  "sex": "M"
                }
              },
              {
                "kamalii_id": 505,
                "kanaka": {
                  "kanaka_id": 380,
                  "name": "Harriet /Boyd/",
                  "xref_id": "@I280@",
                  "sex": "F"
                }
              },
              {
                "kamalii_id": 506,
                "kanaka": {
                  "kanaka_id": 378,
                  "name": "Robert Napunako /Boyd/",
                  "xref_id": "@I278@",
                  "sex": "M"
                }
              },
              {
                "kamalii_id": 507,
                "kanaka": {
                  "kanaka_id": 382,
                  "name": "Caroline Hawea /Boyd/",
                  "xref_id": "@I282@",
                  "sex": "F"
                }
              },
              {
                "kamalii_id": 508,
                "kanaka": {
                  "kanaka_id": 427,
                  "name": "Charlotte Kealoha /Boyd/",
                  "xref_id": "@I327@",
                  "sex": "F"
                }
              },
              {
                "kamalii_id": 509,
                "kanaka": {
                  "kanaka_id": 344,
                  "name": "Sarah Kaleimoku /Boyd/",
                  "xref_id": "@I244@",
                  "sex": "F"
                }
              }
            ]
          }
        ]
      }
    ]
  }
}
```

## query filter by field

```
query kanakaSpecificBirthplace($mookuauhau_id: Int!, $birth_place:String!) {
  kanaka(where: {mookuauhau_id: {_eq: $mookuauhau_id}, birth_place: {_eq: $birth_place}}) {
    kanaka_id
    name
    sex
    residence
    xref_id
    mookuauhau_id
    namakua {
      kanaka {
        name
        xref_id
        sex
      }
    }
    makuakane {
      ohana_id
      xref_id
      kane_id
      wahine {
        kanaka_id
        name
        xref_id
      }
      nakamalii {
        kamalii_id
        kanaka {
          kanaka_id
          name
          xref_id
          sex
        }
      }
    }
    makuahine {
      ohana_id
      xref_id
      wahine_id
      kane {
        kanaka_id
        name
        xref_id
      }
      nakamalii {
        kamalii_id
        kanaka {
          kanaka_id
          name
          xref_id
          sex
        }
      }
    }
    birth_date
    birth_date_dt
    birth_place
    death_date
    death_date_dt
    death_place
    burial_place
  }
}
```

parameters:

```
{"mookuauhau_id": 101, "birth_place": "the Ololo Genealogy"}
```

## summary - totals of all record types in database

```
query m_summary {
  mookuauhau_aggregate {
    aggregate {
      count
    }
  }
  ohana_aggregate {
    aggregate {
      count
    }
  }
  kanaka_aggregate {
    aggregate {
      count
    }
  }
  kamalii_aggregate {
    aggregate {
      count
    }
  }
}
```


### delete a bad/partial load

```
mutation delete_mookuauhau($mookuauhau_id: Int!) {
  delete_kanaka(where: {mookuauhau_id: {_eq: $mookuauhau_id}}) {
    affected_rows
  }
  delete_ohana(where: {mookuauhau_id: {_eq: $mookuauhau_id}}) {
    affected_rows
  }
  update_mookuauhau_by_pk(pk_columns: {mookuauhau_id: $mookuauhau_id}, _set: {load_status: "new"}) {
    file_id
    filename
    load_status
    name
    owner_id
    visibility
  }
}
```

```
{"mookuauhau_id": 5}
```

# Hasura management

## Setup db schema migrations, metadata (Hasura)

To apply schema the database you run

```sh
# must be in the ./hasura dir
cd ./hasura
cp .env.example .env

# check metadata
hasura metadata diff

# apply metadata
hasura metadata apply

# check schema migrations
hasura migrate status --database-name default

# apply migrations
hasura migrate apply --database-name default
```

At that point, go to the hasura console and check it out. 
http://localhost:8089/

## Migrations - defined

Hasura Migrations are files containing PostgreSQL schema definitions in SQL. 
They are paired with 'up' and 'down' sql scripts. We're managing these by hand. 

## Metadata - defined

Hasura metadata contains info on:
- entity one-many relations on the graphql schema
- row- and column- level permissions on database tables (role-based)
- other connection strings or ENV variables

They can be defined in the graphical Hasura Console and exported to the project (and committed to version control), 
or also applied from the source project to the Hasura instance via the console (using hasura admin secret). 

The reason for ENV vars in the docker-compose.yaml is for hasura metadata exports/apply scripts. If the export is from a container, you can't apply the metadata to production otherwise... pain! 🤕 So the practice we set up was to use .env in the project root dir. That will avoid ruining a production metadata with a development one. 

You can read more about migrations at [Migrations & Metadata](https://hasura.io/docs/latest/graphql/core/migrations/index/)

# Neo4j - alternative import code

To import a GEDCOM file to Neo4j, 
- you change your .env to `MUTATION_MODE=neo4j`
- change/enable the NEO4J_* vars
- and then run `npm run load ../your-gedcom-file.ged`

## neo4j / Cypher examples

### query filter with edges

```
MATCH path=(p:Person {birth_place:'the Ololo Genealogy'})-->()
RETURN path
```

### delete all nodes and relations

if testing loads and wanting to delete all...

```
MATCH (n)
DETACH DELETE n
```

# Mock import code

This is for reading the GEDCOM file, and transforming but not inserting anywhere. 
Possibly exporting the abstract syntax tree to the output json file (3rd parameter).

## .env file

```
MUTATION_MODE=mock
```

## command

```
npm run load  ../gedcom/mookuauhau.ged ./output-ast.json
```

# extra notes

Useful bash one-liner to make a new JWT secret - random 64-char string. The Hasura server authorization must have a shared secret with the Authentication provider (Nhost, Auth0, Google Firebase, etc.).

`< /dev/urandom tr -dc \_A-Z-a-z-0-9 | head -c${1:-64};echo;`
