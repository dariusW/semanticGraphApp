<?php
session_start();

global $db;
$db=mysqli_connect("localhost:3306","root","","s_graph");

if (mysqli_connect_errno()){
	die('{"error":"db connection error"}');
}
?>