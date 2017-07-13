<?php
$date = new DateTime();
$datef = $date->format('YmdHis');
$fichier = $datef .'.xml';
file_put_contents("/var/www/htdocs/mymap/".$fichier, file_get_contents('php://input'));
header('Content-type: application/json',true);
   
echo '{"success":true, "url":"http://172.16.10.30/mviewer/?config=../mymap/'.$fichier.'"}'; 
  
?>