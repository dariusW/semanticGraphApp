CREATE DATABASE IF NOT EXISTS s_graph;

CREATE TABLE IF NOT EXISTS s_graph.user (email VARCHAR(100) PRIMARY KEY, passwd CHAR(32) NOT NULL);

CREATE TABLE IF NOT EXISTS s_graph.stats (email VARCHAR(100), stamp VARCHAR(100) NOT NULL, state TEXT NOT NULL, PRIMARY KEY (email,stamp));


