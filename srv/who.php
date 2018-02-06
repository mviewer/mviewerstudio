<?php
$geob_mail="";
$geob_user="anonymous";
foreach (getallheaders() as $name => $value) {
    if (substr( $name, 0, 4 ) === "Sec-") {
        if ($name ===  "Sec-Username") {
                $geob_user=$value;
}
if ($name === "Sec-Email") {
        $geob_mail = $value;
}

}}
//header('Content-type: application/json',true);
//echo '{"user":"'.$geob_user.'", "mail":"'.geob_$mail.'"}';
?>
