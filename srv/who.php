<?php

if (!function_exists('getallheaders')) 
{ 
    function getallheaders() 
    { 
       $headers = array (); 
       foreach ($_SERVER as $name => $value) 
       { 
           if (substr($name, 0, 5) == 'HTTP_') 
           { 
               $headers[str_replace(' ', '-', ucwords(strtolower(str_replace('_', ' ', substr($name, 5)))))] = $value; 
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
