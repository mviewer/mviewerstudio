<?php
$_conf = json_decode(file_get_contents("../config.json"), true)["app_conf"];
$xml = file_get_contents('php://input');
$fichier = hash('md5', $xml) . '.xml';
file_put_contents($_conf['export_conf_folder'] .$fichier, $xml);
header('Content-type: application/json',true);   
echo '{"success":true, "filepath":"'.$fichier.'"}'; 
  
?>