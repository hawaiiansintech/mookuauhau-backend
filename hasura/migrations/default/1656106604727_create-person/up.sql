
CREATE TABLE public.person (
    id integer NOT NULL,
    owner_id uuid NULL, -- nhost user_id
    pc_id integer NOT NULL,
    name text,
    formal_name text,
    xref_id text,
    sex character varying(2),
    _uid text,
    name_surname text,
    name_aka text,
    birth_date text,
    birth_date_dt timestamp(0) with time zone,
    birth_place text,
    family_spouse jsonb,
    family_child jsonb,
    residence text,
    residence_place text,
    burial_place text,
    change_date timestamp(0) with time zone,
    source_uid text,
    create_timestamp timestamp(3) with time zone DEFAULT CURRENT_TIMESTAMP NOT NULL
);
-- ALTER TABLE public.person OWNER TO public;

CREATE SEQUENCE public.person_id_seq
    AS integer
    START WITH 101
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

