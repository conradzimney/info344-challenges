use movies;

drop table if exists movie;

create table movie (
    ID int not null auto_increment,
	title varchar(60),
    released date,
    distributor varchar(30),
    genre varchar(20),
    rating varchar(10),
    gross int,
    tickets int,
    imdb_id varchar(15) not null primary key,
    primary key (ID),
    
    index (title)
);

-- file path must be a full path to the CSV file. Changed to 
-- 'challanges-conradzimney/lamp-server/data/movies-2014.csv' on the droplet server
load data local infile '~/Downloads/movies-2014.csv'
into table movie
fields terminated by ','
optionally enclosed by '"'
ignore 1 lines
(title, released, distributor, genre, rating, gross, tickets, imdb_id);

-- For testing -- 

select * from movie order by gross DESC;