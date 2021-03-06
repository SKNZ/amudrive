﻿CREATE TABLE campus (
  idCampus SERIAL PRIMARY KEY,
  address VARCHAR(512) NOT NULL,
  name VARCHAR(45) NOT NULL UNIQUE,
  long REAL NOT NULL,
  lat REAL NOT NULL);
  
INSERT INTO campus VALUES (DEFAULT, '413 avenue Gaston Berger, 13625 Aix-en-Provence', 'IUT Aix-en-Provence', 43.5143078, 5.451476);
INSERT INTO campus VALUES (DEFAULT, '3 avenue Robert Schuman, 13100 Aix-en-Provence', 'Fac de droit d''Aix-en-provence', 43.5191514, 5.4476824);
INSERT INTO campus VALUES (DEFAULT, 'Médiathèque d''Arles, 13200 Arles', 'Fac de droit d''Arles', 43.67603, 4.625502);

CREATE TABLE client (
  idClient SERIAL PRIMARY KEY,
  userName VARCHAR(30) NOT NULL,
  firstName VARCHAR(30) NOT NULL,
  lastName VARCHAR(50) NOT NULL,
  address VARCHAR(512) NOT NULL,
  long REAL NOT NULL,
  lat REAL NOT NULL,
  mail VARCHAR(127) NOT NULL CONSTRAINT mail_UNIQUE UNIQUE,
  password VARCHAR(129) NOT NULL CHECK (LENGTH(password) = 128),
  registrationTime TIMESTAMP NOT NULL DEFAULT now(),
  messagingParameters INT NOT NULL,
  centersOfInterest VARCHAR(45) NOT NULL,
  phoneNumber VARCHAR(20) NOT NULL,
  mailNotifications BOOLEAN NOT NULL,
  phoneNotifications BOOLEAN NOT NULL,
  newsletter BOOLEAN NOT NULL,
  favoriteCampus INTEGER REFERENCES campus(idCampus) ON DELETE RESTRICT);

INSERT INTO client VALUES (DEFAULT, 'aze', 'mdr', 'ptdr', 'swag', 43.2852755, 5.3842193, 'lel@oklm.kom', 'a48c25f7ec82996486b5a8387cc4e147c628c1f48ae8c868561474fbc5eaf4bec44af63f002681aa8dd32f0dfde1bac24b44d7d6014b73fd26025d94e8f58d3b', DEFAULT, 2, 'lesgroessesqueues', '1337133749', TRUE, TRUE, TRUE, 1);
INSERT INTO client VALUES (DEFAULT, 'swag', 'hipster', 'wallah', 'oklm', 43.2452355, 5.3442293, 'trkl@bonbukkake.jap', '1e31d1b64272d08cfa09d838305d9926a0720bf1abe498ed5b9a06df6ffd00304929c212edd3d60e7295965ccbced6120c2a113f0c199840930f47f62aa33a1f', DEFAULT, 2, 'goutugoutu', '1337133749', TRUE, TRUE, TRUE, 2);
 
CREATE TABLE clientMailValidation (
  idClient INT NOT NULL PRIMARY KEY REFERENCES client ON DELETE RESTRICT,
  validationKey VARCHAR(127) NOT NULL);

CREATE TYPE BV AS ENUM ('M', 'A');

CREATE TABLE vehicle (
  idVehicle SERIAL,
  idClient INT NOT NULL REFERENCES client ON DELETE RESTRICT,
  name VARCHAR(60) NOT NULL,
  bv BV NOT NULL DEFAULT 'M',
  animals BOOLEAN NOT NULL DEFAULT false,
  smoking BOOLEAN NOT NULL DEFAULT false,
  eat BOOLEAN NOT NULL DEFAULT false,
  PRIMARY KEY(idVehicle, idClient));
  
INSERT INTO vehicle VALUES (DEFAULT, 2, 'RENAULT CLIO V12 TWIN TURBO OKLM', 'M', false, false, false);

  
CREATE TABLE carPooling (
  idCarPooling SERIAL PRIMARY KEY,
  address VARCHAR(512) NOT NULL,
  long REAL NOT NULL,
  lat REAL NOT NULL,
  idCampus SERIAL REFERENCES campus ON DELETE RESTRICT,
  idClient INT NOT NULL REFERENCES client ON DELETE RESTRICT,
  idVehicle INT NOT NULL,
  campusToAddress BOOLEAN NOT NULL,
  room INT NOT NULL,
  luggage INT NOT NULL,
  talks BOOLEAN NOT NULL DEFAULT false,
  radio BOOLEAN NOT NULL DEFAULT false,
  meetTime timestamp  NOT NULL,
  price numeric(5,2) NOT NULL,
  CONSTRAINT fk_vehicle
    FOREIGN KEY (idVehicle, idClient)
    REFERENCES vehicle (idVehicle, idClient)
    ON DELETE RESTRICT);
  
INSERT INTO carPooling VALUES (DEFAULT, 'Rue Borde, Marseille', 5.391744199999948, 43.2790537, 1, 2, 1, false, 4, 0, true, false, to_timestamp('2014-12-31 08:00:00', 'YYYY-MM-DD HH24:MI:SS'), 0);
INSERT INTO carPooling VALUES (DEFAULT, 'Rue Sainte-Famille, Marseille', 5.39393819999998, 43.27844049999999, 1, 2, 1, false, 4, 0, true, true, to_timestamp('2014-12-31 08:00:00', 'YYYY-MM-DD HH24:MI:SS'), 0);
INSERT INTO carPooling VALUES (DEFAULT, 'Rue Roger Renzo, Marseille', 5.394131000000016, 43.2779369, 1, 2, 1, false, 4, 0, false, true, to_timestamp('2014-12-31 08:00:00', 'YYYY-MM-DD HH24:MI:SS'), 0);

CREATE TABLE carPoolingJoin (
  idCarPooling  INT NOT NULL REFERENCES carPooling ON DELETE RESTRICT,
  idClient INT NOT NULL REFERENCES client ON DELETE RESTRICT,
  accept BOOLEAN NOT NULL,
  PRIMARY KEY (idCarPooling, idClient));

CREATE TABLE comment (
  idClient INT NOT NULL REFERENCES client ON DELETE RESTRICT,
  idCarPooling INT NOT NULL REFERENCES carPooling ON DELETE RESTRICT,
  idMessage SERIAL NOT NULL,
  comment VARCHAR(1024) NOT NULL,
  poolingMark INT NOT NULL,
  driverMark INT NOT NULL,
  PRIMARY KEY (idClient, idCarPooling, idMessage),
  CONSTRAINT fk_carPoolingJoin
    FOREIGN KEY (idCarPooling, idClient)
    REFERENCES carPoolingJoin (idCarPooling, idClient)
    ON DELETE RESTRICT);

CREATE INDEX fk_client_idx ON carPoolingJoin(idClient ASC);

CREATE INDEX fk_carpooling_idx ON carPoolingJoin(idCarPooling ASC);

CREATE INDEX fk_campus_idx ON carPooling(idcampus ASC);

CREATE INDEX fk_client_carPooling_idx ON carPooling(idClient ASC);

CREATE INDEX fk_client_vehicule_idx ON vehicle(idClient ASC);

-- Haversine Formula based geodistance in kilometers (copy/paste from https://gist.github.com/cypres/831833)
CREATE OR REPLACE FUNCTION public.geodistance(a point, b point)
  RETURNS double precision AS
$BODY$
SELECT asin(sqrt(
  sin(radians($2[0]-$1[0])/2)^2 +
  (
    sin(radians($2[1]-$1[1])/2)^2 *
    cos(radians($1[0])) *
    cos(radians($2[0]))
  )
)) * 6371 * 2 AS distance;
$BODY$
  LANGUAGE sql IMMUTABLE
  COST 100;