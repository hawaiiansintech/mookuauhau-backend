import { gqlRequest, gql } from '../graphql-client.js';
import { Family } from '../../models/Family.js';
import { Person } from '../../models/Person.js';
import { Genealogy } from '../../models/Genealogy.js';
import { Kamalii } from '../../models/Kamalii.js';
import { parseGedcomDate } from '../utils.js';
import { Repository } from '../../models/Repository.js';
import { Source } from '../../models/Source.js';
import { SourcePointer } from '../../models/SourcePointer.js';
import { RepositoryPointer } from '../../models/RepositoryPointer.js';

export async function createGenealogy(genealogy: Genealogy, role: string, jwt_token: string) {
    console.log("createGenealogy()");

    // if (!jwt_token) {
    //     return;
    // }

    let params: { [key: string]: any } = {
        name: genealogy.name,
        // xref_id: genealogy.xref_id,
        visibility: 'private',
    };

    if (genealogy.source_uid) { params.filename = genealogy.source_uid; }
    if (genealogy.change_date) { params.change_date = genealogy.change_date; }
    if (genealogy.visibility && genealogy.visibility === 'public') {
        params.visibility = genealogy.visibility;
    }

    const query = gql`
    mutation insertMookuauhau($object: mookuauhau_insert_input!) {
        insert_mookuauhau_one(object: $object) {
            mookuauhau_id
            name
            owner_id
            filename
            visibility
            create_timestamp
        }
    }
    `;
    const variables = {
        object: params,
    };

    let addHeaders = {
        "x-hasura-role": role
    };

    return await gqlRequest(query, variables, jwt_token, addHeaders);
}

export async function createPerson(person: Person, mookuauhauId: number|undefined, role: string, jwt_token: string) {
    console.log("createPerson()");
    console.log("mookuauhauId: ", mookuauhauId);

    // if (!jwt_token) {
    //     return;
    // }

    let params: { [key: string]: any } = {
        name: person.name,
        xref_id: person.xref_id,
    };

    if (person.sex) { params.sex = person.sex; }
    if (person.formal_name) { params.formal_name = person.formal_name; }
    if (person.birth_date) { params.birth_date = person.birth_date; }
    if (person.birth_place) { params.birth_place = person.birth_place; }
    if (person.death_date) { params.death_date = person.death_date; }
    if (person.death_place) { params.death_place = person.death_place; }
    if (person.burial_place) { params.burial_place = person.burial_place; }
    if (person.change_date) { params.change_date = person.change_date; }
    if (person.name_surname) { params.name_surname = person.name_surname; }
    if (person.residence) { params.residence = person.residence; }
    if (person.residence_place) { params.residence_place = person.residence_place; }

    if (mookuauhauId) { params.mookuauhau_id = mookuauhauId; }

    if (parseGedcomDate(person.birth_date)) {
        params.birth_date_dt = parseGedcomDate(person.birth_date);
    }
    if (parseGedcomDate(person.death_date)) {
        params.death_date_dt = parseGedcomDate(person.death_date);
    }

    const query = gql`
    mutation insert_single_Person($object: kanaka_insert_input!) {
        insert_kanaka_one(object: $object) {
            kanaka_id
            name
            xref_id
            mookuauhau_id
        }
    }
    `;
    const variables = {
        object: params,
    };

    let addHeaders = {
        "x-hasura-role": role
    };

    return await gqlRequest(query, variables, jwt_token, addHeaders);
}

export async function createFamily(fam: Family, mookuauhau_id: number|undefined, role: string, jwt_token: string) {
    console.log("createFamily() ", fam.xref_id);

    // if (!jwt_token) {
    //     return;
    // }
    console.log("fam.xref_id : ", fam.xref_id);
    console.log("fam: ", fam);

    let params: { [key: string]: any } = {
        xref_id: fam.xref_id,
        formal_name: fam.formal_name,
    };
    if (fam.formal_name) { params.formal_name = fam.formal_name; }
    // if (fam.wife) { params.wahine_id = fam.wife; }
    // if (fam.husband) { params.kane_id = fam.husband; }

    const makuakane_kanaka = await get_kanaka_by_xrefid(mookuauhau_id, fam.husband, role, jwt_token);
    console.log("makuakane_kanaka : ", makuakane_kanaka);
    if (makuakane_kanaka?.kanaka.length > 0 && makuakane_kanaka?.kanaka[0].kanaka_id ) {
        // first only
        params.kane_id = makuakane_kanaka?.kanaka[0].kanaka_id;
    }

    const makuahine_kanaka = await get_kanaka_by_xrefid(mookuauhau_id, fam.wife, role, jwt_token);
    console.log("makuahine_kanaka : ", makuahine_kanaka);
    if (makuahine_kanaka?.kanaka.length > 0 && makuahine_kanaka?.kanaka[0].kanaka_id ) {
        // first only
        params.wahine_id = makuahine_kanaka?.kanaka[0].kanaka_id;
    }

    if (mookuauhau_id) { params.mookuauhau_id = mookuauhau_id; }

    const query = gql`
    mutation insert_single_Ohana($object: ohana_insert_input!) {
        insert_ohana_one(object: $object) {
            ohana_id
            change_date
            formal_name
            kane_id
            marriage_date
            marriage_date_dt
            marriage_place
            residence
            residence_place
            source_uid
            wahine_id
            xref_id
            mookuauhau_id
        }
    }
    `;
    const variables = {
        object: params,
    };

    let addHeaders = {
        "x-hasura-role": role
    };

    const resultCreateOhana = await gqlRequest(query, variables, jwt_token, addHeaders);
    const ohana_id = resultCreateOhana?.insert_ohana_one.ohana_id;
    // console.log("resultCreateOhana : ", resultCreateOhana);
    console.log("ohana_id : ", ohana_id);

    // // relations / edges

    // if (fam.xref_id && fam.husband) {
    //     const makuakane = await famLinkHusband(ohana_id, makuakane_kanaka_id, role, jwt_token);
    // }
    // else {
    //     console.log(`no famLinkParent husband for ${fam.xref_id}, ${fam.husband}`);
    // }

    // if (fam.xref_id && fam.wife) {
    //     const makuahine = await famLinkWife(ohana_id, makuahine_kanaka_id, role, jwt_token);
    // }
    // else {
    //     console.log(`no famLinkParent wife for ${fam.xref_id}, ${fam.wife}`);
    // }

    if (fam.children) {
        console.log("iterating fam.children...");
        for (let index = 0; index < fam.children.length; index++) {
            const c = fam.children[index];

            console.log("fam.xref_id : ", fam.xref_id);
            console.log("c.xref_id: ", c.xref_id);
            console.log("c._frel : ", c._frel);
            console.log("c._mrel : ", c._mrel);

            if (fam.xref_id && c.xref_id) {
                const kamalii_kanaka = await get_kanaka_by_xrefid(mookuauhau_id, c.xref_id, role, jwt_token);
                console.log("kamalii_kanaka: ", kamalii_kanaka);

                if(kamalii_kanaka.kanaka.length > 0) {
                    // first
                    const kid: number|undefined = kamalii_kanaka.kanaka[0]?.kanaka_id;
                    const kid_xref_id = kamalii_kanaka.kanaka[0]?.xref_id;
                    console.log("kid: ", kid);
                    console.log("kid_xref_id: ", kid_xref_id);

                    const crv = await famLinkChild(mookuauhau_id, fam.xref_id, kid_xref_id, c._frel, c._mrel, role, jwt_token);
                }
                else {
                    console.log("kamalii not linked to kanaka record - not normal");
                }
            }
            else {
                console.log(`no famLinkChild for ${fam.xref_id}, ${c.xref_id}`);
            }

            if (fam.xref_id && c.xref_id && fam.husband) {
                // linkChildParentDirect(fam.husband, c.xref_id);
            }

            if (fam.xref_id && c.xref_id && fam.wife) {
                // linkChildParentDirect(fam.wife, c.xref_id);
            }

        }
    }

}

export async function createRepository(repo: Repository, mookuauhau_id: number|undefined, role: string, jwt_token: string) {
    console.log("createRepository() ", repo.xref_id);
    return await {};
}

export async function createSource(source: Source, mookuauhau_id: number|undefined, role: string, jwt_token: string) {
    console.log("createSource() ", source.xref_id);
    return await {};
}

export async function createSourcePointer(sp: SourcePointer, mookuauhau_id: number|undefined, role: string, jwt_token: string) {
    console.log("createSourcePointer() ", sp.pointer);
    return await {};
}

export async function createRepositoryPointer(rp: RepositoryPointer) {
    console.log("createRepositoryPointer() ", rp.pointer);
    return await {};
}

export async function famLinkHusband(fam_id: string, person_id: string, role: string, jwt_token: string) {
    console.log(`famLinkHusband() ${fam_id} ${person_id}`);
    // const rel = ptype.toUpperCase(); // K | W

    // update mutation
    // update ohana set kane_id = x where ohana_id = y

    const query = gql`
    mutation update_ohana_kane_by_pk($ohana_id: Int!, $kane_id: Int!) {
        update_ohana_by_pk(pk_columns: {ohana_id: $ohana_id}, _set: {kane_id: $kane_id}) {
            ohana_id
            kane_id
        }
    }
    `;
    const variables = {
        ohana_id: fam_id,
        kane_id: person_id,
    };

    let addHeaders = {
        "x-hasura-role": role
    };

    return await gqlRequest(query, variables, jwt_token, addHeaders);
}

export async function famLinkWife(fam_id: string, person_id: string, role: string, jwt_token: string) {
    console.log(`famLinkWife() ${fam_id} ${person_id}`);
    // const rel = ptype.toUpperCase(); // K | W

    const query = gql`
    mutation update_ohana_wahine_by_pk($ohana_id: Int!, $wahine_id: Int!) {
        update_ohana_by_pk(pk_columns: {ohana_id: $ohana_id}, _set: {wahine_id: $wahine_id}) {
            ohana_id
            wahine_id
        }
    }
    `;
    const variables = {
        ohana_id: fam_id,
        wahine_id: person_id,
    };

    let addHeaders = {
        "x-hasura-role": role
    };

    return await gqlRequest(query, variables, jwt_token, addHeaders);
}

export async function get_ohana_by_pk(ohana_id: number, role: string, jwt_token: string) {
    console.log(`get_ohana_by_pk(${ohana_id}, role, jwt_token)`);

    const query = gql`
    query get_ohana_by_pk($ohana_id:Int!) {
        ohana_by_pk(ohana_id: $ohana_id) {
          birth_place
          burial_place
          change_date
          create_timestamp
          formal_name
          kane_id
          marriage_date
          marriage_date_dt
          ohana_id
          marriage_place
          residence
          residence_place
          source_uid
          wahine_id
          xref_id
          mookuauhau_id
        }
      }
    `;
    const variables = {
        ohana_id: ohana_id,
    };

    let addHeaders = {
        "x-hasura-role": role
    };

    return await gqlRequest(query, variables, jwt_token, addHeaders);
}

export async function get_kanaka_by_pk(kanaka_id: number, role: string, jwt_token: string) {
    console.log(`get_kanaka_by_pk(${kanaka_id}, role, jwt_token)`);

    const query = gql`
    query get_kanaka_by_pk($kanaka_id:Int!) {
        kanaka_by_pk(kanaka_id: $kanaka_id) {
          kanaka_id
          _uid
          birth_date
          birth_date_dt
          birth_place
          burial_place
          change_date
          family_child
          create_timestamp
          family_spouse
          formal_name
          name
          name_aka
          name_surname
          residence_place
          residence
          sex
          source_uid
          xref_id
          mookuauhau_id
        }
      }
    `;
    const variables = {
        kanaka_id: kanaka_id,
    };

    let addHeaders = {
        "x-hasura-role": role
    };

    return await gqlRequest(query, variables, jwt_token, addHeaders);
}

export async function get_kanaka_by_xrefid(mookuauhau_id: number|undefined, xref_id: string|undefined, role: string, jwt_token: string) : Promise<any|undefined> {
    console.log(`get_kanaka_by_xrefid(${mookuauhau_id}, ${xref_id}, role, jwt_token)`);

    if(!xref_id) {
        return undefined;
    }

    const query = gql`
    query get_kanaka_by_xrefid($mookuauhau_id:Int!, $xref_id:String!) {
        kanaka(where: {xref_id: {_eq: $xref_id}, mookuauhau_id: {_eq: $mookuauhau_id} }) {
            kanaka_id
            _uid
            birth_date
            birth_date_dt
            birth_place
            burial_place
            change_date
            family_child
            create_timestamp
            family_spouse
            formal_name
            name
            name_aka
            name_surname
            residence_place
            residence
            sex
            source_uid
            xref_id
            mookuauhau_id
        }
    }
    `;
    const variables = {
        mookuauhau_id: mookuauhau_id,
        xref_id: xref_id,
    };

    let addHeaders = {
        "x-hasura-role": role
    };

    return await gqlRequest(query, variables, jwt_token, addHeaders);
}

export async function get_ohana_by_xrefid(mookuauhau_id: number|undefined, xref_id: string|undefined, role: string, jwt_token: string) : Promise<any|undefined> {
    console.log(`get_ohana_by_xrefid(${mookuauhau_id}, ${xref_id}, role, jwt_token)`);

    if(!xref_id) {
        return undefined;
    }

    const query = gql`
    query get_ohana_by_xrefid($mookuauhau_id:Int!, $xref_id:String!) {
        ohana(where: {xref_id: {_eq: $xref_id}, mookuauhau_id: {_eq: $mookuauhau_id} }) {
            ohana_id
            change_date
            create_timestamp
            formal_name
            source_uid
            xref_id
            kane_id
            wahine_id
            marriage_date
            marriage_date_dt
            marriage_place
            mookuauhau_id
        }
    }
    `;
    const variables = {
        mookuauhau_id: mookuauhau_id,
        xref_id: xref_id,
    };

    let addHeaders = {
        "x-hasura-role": role
    };

    return await gqlRequest(query, variables, jwt_token, addHeaders);
}

export async function famLinkChild(mookuauhau_id: number|undefined, fam_id: string|undefined, person_id: string, frel: string|undefined, mrel: string|undefined, role: string, jwt_token: string) : Promise<number|undefined> {
    console.log(`famLinkChild() ${fam_id} ${person_id}`);
    let kamalii_id: number|undefined;
    try {

        // lookup ohana_id from fam_id|xref_id
        const ohanamatches = await get_ohana_by_xrefid(mookuauhau_id, fam_id, role, jwt_token);
        console.log("ohanamatches: ", ohanamatches);
        // lookup kanaka_id from person_id|xref_id
        const kanakamatches = await get_kanaka_by_xrefid(mookuauhau_id, person_id, role, jwt_token);
        console.log("kanakamatches: ", kanakamatches);
        if(ohanamatches?.ohana.length > 0 && kanakamatches?.kanaka.length > 0) {
            const ohana = ohanamatches.ohana[0];
            console.log("ohana: ", ohana);

            const kanaka = kanakamatches.kanaka[0];
            console.log("kanaka: ", kanaka);

            const query = gql`
            mutation insert_single_Child($object: kamalii_insert_input!) {
                insert_kamalii_one(object: $object) {
                    kamalii_id
                    ohana_id
                    kanaka_id
                }
            }
            `;
            const variables = {
                object: {
                    kanaka_id: kanaka.kanaka_id,
                    ohana_id: ohana.ohana_id,
                    _frel: frel,
                    _mrel: mrel,
                }
            };

            let addHeaders = {
                "x-hasura-role": role
            };

            kamalii_id = await gqlRequest(query, variables, jwt_token, addHeaders);
        }
        else {
            console.log(`no matches for kanaka by person xrefid '${person_id}'`);
        }

    } finally {
        await sleepytime();
    }

    return kamalii_id;
}

export async function linkPersons(name1: string, rel: string, name2: string) {
//     const result = await session.run(
//         `
// MATCH (n1:Person {name: '${name1}'})
// MATCH (n2:Person {name: '${name2}'})
// CREATE (n1)-[rel:${rel}]->(n2)
//         `,
//         { name1: name1, name2: name2 }
//     );

//     console.log(result);
}

export async function linkChildParentDirect(parentId: string, childId: string) {
    console.log(`linkChildParentDirect() ${parentId} ${childId}`);
    // try {

    //     if (driver) {
    //         console.log('opening neo4jsession [child_direct]');
    //         neo4jsession = driver.session();
    //     }

    //     const mutation = `
    //     MATCH (cp:Person {xref_id: '${childId}'})
    //     MATCH (pp:Person {xref_id: '${parentId}'})
    //     CREATE (cp)-[rel:IS_CHILD]->(pp)
    //             `;
    //     console.log("mutation: ", mutation);

    //     // Neo4jError: ForsetiClient[transactionId=136773, clientId=4764] can't acquire ExclusiveLock{owner=ForsetiClient[transactionId=136772, clientId=4770]} on RELATIONSHIP(4166), because holders of that lock are waiting for ForsetiClient[transactionId=136773, clientId=4764].
    //     // Wait list:ExclusiveLock[
    //     // Client[136772] waits for [ForsetiClient[transactionId=136773, clientId=4764]]]
    //     // https://github.com/neo4j/neo4j/issues/6248
    //     // https://neo4j.com/docs/java-reference/current/transaction-management/#transactions-deadlocks
    //     // creating indexes seems to help
    //     const result = await neo4jsession.run(
    //         mutation,
    //         {}
    //         // { childId: childId, parentId: parentId } // not used?
    //     );

    //     // console.log(result);

    // } finally {
    //     if (neo4jsession) {
    //         console.log('closing neo4jsession [child_direct]');
    //         neo4jsession.close();
    //     }

    //     await sleepytime();
    // }

}

export async function get_mookuauhau_queueload_list(role: string, jwt_token: string) : Promise<any|undefined> {
    console.log(`get_mookuauhau_queueload_list(role, jwt_token)`);

    const query = gql`
        query getMookuauhauQueueLoadList {
        mookuauhau(where: {load_status: {_eq: "new"}}) {
            mookuauhau_id
            name
            filename
            owner_id
            file_id
            load_status
            visibility
            create_timestamp
        }
        }
    `;
    const variables = {
    };

    let addHeaders = {
        "x-hasura-role": role
    };

    return await gqlRequest(query, variables, jwt_token, addHeaders);
}

export async function set_mookuauhau_loadstatus(mookuauhau_id: number, load_status: string, role: string, jwt_token: string) : Promise<void|undefined> {
    console.log(`set_mookuauhau_loadstatus() ${mookuauhau_id} ${load_status}`);

    const query = gql`
        mutation set_mookuauhau_loadstatus($mookuauhau_id:Int!, $load_status:String!) {
            update_mookuauhau_by_pk(pk_columns: {mookuauhau_id: $mookuauhau_id}, _set: {load_status: $load_status}) {
                mookuauhau_id
                load_status
            }
        }
    `;
    const variables = {
        mookuauhau_id: mookuauhau_id,
        load_status: load_status,
    };

    let addHeaders = {
        "x-hasura-role": role
    };

    return await gqlRequest(query, variables, jwt_token, addHeaders);
}


export async function sleepytime() {
    const sleeptime = 0;

    if(sleeptime) {
        // https://stackoverflow.com/a/38084640/408747
        await setTimeout(
            () => {
                console.log(`waiting ${sleeptime}...`);
            }
            , sleeptime
        );
    }
}

export function appCloseHandler() {

}

export const mutation_fns: { [key: string]: Function } = {
    'creategenealogy': (genealogy: Genealogy, role: string, jwt_token: string) => createGenealogy(genealogy, role, jwt_token),
    'createperson': (person: Person, mookuauhauId: number|undefined, role: string, jwt_token: string) => createPerson(person, mookuauhauId, role, jwt_token),
    'createfamily': (fam: Family, mookuauhauId: number|undefined, role: string, jwt_token: string) => createFamily(fam, mookuauhauId, role, jwt_token),
    'createrepository': (repo: Repository, mookuauhauId: number|undefined, role: string, jwt_token: string) => createRepository(repo, mookuauhauId, role, jwt_token),
    'createsource': (source: Source, mookuauhauId: number|undefined, role: string, jwt_token: string) => createSource(source, mookuauhauId, role, jwt_token),
    'createsourcepointer': (sp: SourcePointer, mookuauhauId: number|undefined, role: string, jwt_token: string) => createSourcePointer(sp, mookuauhauId, role, jwt_token),
    'createrepositorypointer': (rp: RepositoryPointer) => createRepositoryPointer(rp),

    'linkpersons': (name1: string, rel: string, name2: string) => linkPersons(name1, rel, name2),
    'linkchildparentdirect': (parentId: string, childId: string) => linkChildParentDirect(parentId, childId),
    'indexcreation': () => console.log('no op'),
    'close': () => appCloseHandler(),
    'sleepytime': () => sleepytime(),
    'insertmode': () => true,
}
