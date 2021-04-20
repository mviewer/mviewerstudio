<?php

if (!function_exists('getallheaders')) {
    function qq() {
        $headers = array ();
        foreach ($_SERVER as $name => $value) {
            if (substr($name, 0, 5) == "HTTP_") {
                $headers[str_replace(" ", "-", ucwords(strtolower(str_replace("_", " ", substr($name, 5)))))] = $value;
            }
        }
        return $headers;
    }
}

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
    $orgname = "";
    foreach (getallheaders() as $name => $value) {
        if (substr( $name, 0, 4 ) === "sec-") {
            if ($name ===  "sec-firstname") {
                    $firstname=utf8_encode($value);
            }
            if ($name ===  "sec-lastname") {
                    $lastname=utf8_encode($value);
            }
            if ($name ===  "sec-orgname") {
                    $orgname=utf8_encode($value);
            }

        }
    }
    return array( $firstname, $lastname, $orgname );
}
