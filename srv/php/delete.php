<?php
//include 'who.php';
require_once('who.php');
$geob_user = getUser();
$_conf = json_decode(file_get_contents("../../apps/config.json"), true)["app_conf"];
$files = glob($_conf['export_conf_folder'] . "*.xml");
$counter = 0;
if (is_array($files)) {
     foreach($files as $filename) {        
        $xml = simplexml_load_file("$filename");
        if ($xml !== false) {
            $content = file_get_contents("$filename");
            $content_replace = str_replace("rdf:", "", $content);  // delete all rdf: values to manipulate input with SimpleXml object
            $content_replace2 = str_replace("dc:", "", $content_replace);  // delete all dc: values to manipulate input with SimpleXml object
            $xml = simplexml_load_string($content_replace2); // load a SimpleXML object
            $xml_to_json = json_decode(json_encode($xml), 1); // use json to get all values into an array
            $description = $xml_to_json["metadata"]["RDF"]["Description"];
            if ($description["creator"] === $geob_user) {
                unlink($filename);
                $counter += 1;
            }
         }
        
     }
     
     header('Content-type: application/json',true);
     echo json_encode(array('deleted_files' => $counter));
}
?>
