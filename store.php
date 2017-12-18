<?php
$_conf = json_decode(file_get_contents("config.json"), true)["app_conf"];
$xml = file_get_contents('php://input');
$fichier = hash('md5', $xml) . '.xml';
file_put_contents("/var/www/htdocs/mymap/".$fichier, $xml);
header('Content-type: application/json',true);   
echo '{"success":true, "url":"'. $_conf['mviewer_instance'] .'?config='. $_conf['generator_path_from_mviewer'] .$fichier.'"}'; 
  
?>