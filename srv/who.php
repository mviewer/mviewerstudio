<?php
header('Content-type: application/json; charset=utf-8',true);
function getUser() {
    $user = "anonymous";
    foreach (getallheaders() as $name => $value) {
        if (substr( $name, 0, 4 ) === "sec-") {
            if ($name ===  "sec-username") {
                    $user=$value;
            }
        }
    }
    return $user;
}

function getUserInfos() {
    $firstname = "";
    $lastname = "";
    foreach (getallheaders() as $name => $value) {
        if (substr( $name, 0, 4 ) === "sec-") {
            if ($name ===  "sec-firstname") {
                    $firstname=$value;
            }
            if ($name ===  "sec-lastname") {
                    $lastname=$value;
            }
        }
    }
    return array( $firstname, $lastname );
}
?>

