
#  mookuauhau-backend / gedcomloader

Usage:

```
npm run build
npm run load ../gedcom/mookuauhau.ged
```

# load to neo4j database .env file entries

```
MUTATION_MODE=neo4j
NEO4J_ENDPOINT=bolt://localhost
NEO4J_USER=yourusername
NEO4J_PASS=yourpassword
INSERT_MODE=true
```

# load to hasura graphql database .env file entries

```
MUTATION_MODE=graphql
GRAPHQL_ENDPOINT=https://something/v1/graphql
INSERT_MODE=true
```

# neo4j / Cypher examples

## query filter with edges

```
MATCH path=(p:Person {birth_place:'the Ololo Genealogy'})-->()
RETURN path
```

## delete all nodes and relations

if testing loads and wanting to delete all...

```
MATCH (n)
DETACH DELETE n
```

# Hasura / graphql examples

## query filter 

```
query kanakaSpecificBirthplace {
  kanaka(where: {birth_place: {_eq: "the Ololo Genealogy"}}) {
    kanaka_id
    name
    formal_name
    birth_place
    birth_date
    change_date
    mookuauhau_id
    makuakane {
      ohana_id
      nakamalii {
        kamalii_id
        kanaka {
          kanaka_id
          name
          xref_id
        }
        kanaka_id
      }
    }
    makuahine {
      ohana_id
      nakamalii {
        kamalii_id
        kanaka {
          kanaka_id
          name
          xref_id
        }
        ohana {
          ohana_id
          kane {
            kanaka_id
            name
            xref_id
          }
          wahine {
            kanaka_id
            name
            xref_id
          }
        }
      }
    }
    kamalii {
      kanaka_id
      kamalii_id
      ohana_id
      kanaka {
        kanaka_id
        name
        sex
        xref_id
      }
    }
  }
}
```

## summary 

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

## Hasura + postgresql on docker 

https://hasura.io/docs/latest/graphql/core/deployment/deployment-guides/docker/

quickstart:
```
cd ./hasura-docker
{edit .env}
{edit docker-compose.yml}
docker-compose up -d
docker ps
```

Then you can connect to localhost:port for the Hasura endpoint as well as the postgresql you configured. 

The .env under ./hasura-docker can look like this:
```
HASURA_GRAPHQL_METADATA_DATABASE_URL=postgres://postgres:postgrespassword@postgres:5432/postgres
PG_DATABASE_URL=postgres://postgres:postgrespassword@postgres:5432/postgres
HASURA_GRAPHQL_ADMIN_SECRET=gottokeepasecret
JWT_SECRET_KEY=sharedsecretwithyourauthenticationprovider
HASURA_GRAPHQL_JWT_SECRET='{"type":"HS256", "key": "${JWT_SECRET_KEY}"}'
```


## Hasura mutations and metadata

creating new database schema, by applying all migrations 

```
cd ./hasura
hasura migrate --endpoint https://your.hasura.endpoint --admin-secret yoursecret  --database-name default status
hasura migrate --endpoint https://your.hasura.endpoint --admin-secret yoursecret  --database-name default apply
```

apply only 2 migrations 
```
hasura migrate --endpoint https://your.hasura.endpoint --admin-secret yoursecret  --database-name default apply --up 2
```

rollback 2 migrations 
```
hasura migrate --endpoint https://your.hasura.endpoint --admin-secret yoursecret  --database-name default apply --down 2
```

apply metadata from files to hasura instance (after viewing diff)
```
hasura metadata --endpoint https://your.hasura.endpoint --admin-secret yoursecret diff
hasura metadata --endpoint https://your.hasura.endpoint --admin-secret yoursecret apply
```

# system architecture

![software architecture diagram](static/moʻokūʻauhau-gedcom-loader.png?raw=true)


## generate 64 char string

useful to make a new jwt secret

`< /dev/urandom tr -dc \_A-Z-a-z-0-9 | head -c${1:-64};echo;`

