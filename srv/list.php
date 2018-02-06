<?php
include 'who.php';
$_conf = json_decode(file_get_contents("../config.json"), true)["app_conf"];
$the_files = glob($_conf['export_conf_folder'] . "*.xml");
usort( $the_files, function( $a, $b ) { return filemtime($a) - filemtime($b); } );
$files = array_reverse($the_files);
$data = array();
if (is_array($files)) {

     foreach($files as $filename) {        
        $xml = simplexml_load_file("$filename")or die("Error: Cannot load file");        
        $content = file_get_contents("$filename");
        $content_replace = str_replace("rdf:", "", $content);  // delete all rdf: values to manipulate input with SimpleXml object
        $content_replace2 = str_replace("dc:", "", $content_replace);  // delete all dc: values to manipulate input with SimpleXml object
        $xml = simplexml_load_string($content_replace2); // load a SimpleXML object
        $xml_to_json = json_decode(json_encode($xml), 1); // use json to get all values into an array
        $description = $xml_to_json["metadata"]["RDF"]["Description"];
        if ($description["creator"] == $geob_user) {
            $url = str_replace($_conf['export_conf_folder'], $_conf['conf_path_from_mviewer'], "$filename");
            $metadata = array(
                "url" => $url,
                "creator" => $description["creator"],
                "date" => $description["date"],
                "title" => $description["title"],
                "subjects" => $description["subject"],
            );        
            array_push( $data , $metadata);
        }
        
        
     }
     
     header('Content-type: application/json',true);   
     echo json_encode($data);  

}
?>