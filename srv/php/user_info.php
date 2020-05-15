<?php
require_once('who.php');
$geob_user_infos = getUserInfos();
header('Content-type: application/json',true);
echo '{"first_name": "'.$geob_user_infos[0].'", "last_name":"'.$geob_user_infos[1].'", "organisation": {"legal_name":""}}';
?>