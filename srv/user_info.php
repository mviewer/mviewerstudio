<?php
require_once('who.php');
$geob_user_infos = getUserInfos();
header('Content-type: application/json',true);
echo '{"firstname": "'.$geob_user_infos[0].'", "lastname":"'.$geob_user_infos[1].'", "organisation": {"legal_name":""}}';
?>