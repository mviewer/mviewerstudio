<?php
function getUser() {
    $user = "anonymous";
    foreach (getallheaders() as $name => $value) {
        if (substr( $name, 0, 4 ) === "Sec-") {
            if ($name ===  "Sec-Username") {
                    $user=$value;
            }
        }
    }
    return $user;
}
?>
