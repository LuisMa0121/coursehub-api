import data from '../dist/data-source.js';
import {InitialRelationalAndAuthSchema1728670000000 as Initial} from '../dist/migrations/1728670000000-InitialRelationalAndAuthSchema.js';
import {UpgradeStageOneSchema1791676800000 as Upgrade} from '../dist/migrations/1791676800000-UpgradeStageOneSchema.js';
await data.initialize();const q=data.createQueryRunner();
try{for(const legacy of [false,true]){await q.startTransaction();
try{await q.query('CREATE SCHEMA etapa2_verification');await q.query('SET LOCAL search_path TO etapa2_verification');
if(legacy){await q.query(`CREATE TABLE books (id SERIAL PRIMARY KEY,title varchar(200) NOT NULL,author varchar(200) NOT NULL,isbn varchar(13) UNIQUE NOT NULL,year integer NOT NULL,genre varchar(100) NOT NULL,"availableCopies" integer NOT NULL DEFAULT 1)`);await q.query(`INSERT INTO books(title,author,isbn,year,genre) VALUES ('Libro previo','Prueba','1234567890',2020,'Prueba')`);}
await new Initial().up(q);await new Upgrade().up(q);
const col=await q.query("SELECT column_name FROM information_schema.columns WHERE table_schema='etapa2_verification' AND table_name='books' AND column_name='categoryId'");if(col.length!==1)throw Error('No existe categoryId');
const rows=await q.query('SELECT count(*)::int AS count FROM books');if(rows[0].count!==(legacy?1:0))throw Error('Datos anteriores alterados');
console.log(legacy?'Migración desde etapa 1 conserva el libro: OK':'Migración sobre esquema vacío: OK');
}finally{await q.rollbackTransaction();}}
}finally{await q.release();await data.destroy();}

