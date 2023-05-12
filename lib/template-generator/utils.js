/**
 * Will hash a content to compare string.
 * Inspired from : https://stackoverflow.com/questions/7616461/generate-a-hash-from-string-in-javascript
 * @param {string} value to hash
 * @returns {number} hash code fot the entire given string
 */
export const hashString = (value) => {
    var hash = 0,
    i, chr;
    if (value.length === 0) return hash;
    for (i = 0; i < value.length; i++) {
        chr = value.charCodeAt(i);
        hash = ((hash << 5) - hash) + chr;
        hash |= 0; // Convert to 32bit integer
    }
    return hash;
}

export const getHashFromTemplate = (template) => {
    let mstContent = Mustache.parse(template);
    if (mstContent[0] && mstContent[0][1]) {
        let asXML = $.parseXML(mstContent[0][1]);
        return asXML.querySelector("hash").innerHTML;   
    }
    return null;
}

export const readTemplateWithoutHash = (template) => {
    let mstContent = Mustache.parse(template);
    mstContent = Mustache.parse(mstContent);
}

export const compareHash = (template) => {
    let originalHash = getHashFromTemplate(template);
    let contentNoHash = template.split("</hash>")[1];
    let newHash = hashString(contentNoHash);
    console.log("READ SAVED TEMPLATE");
    console.log("================");
    console.log(newHash);
    console.log(contentNoHash);
    return newHash == originalHash
}

export const readTemplate = (url) => {
    fetch(url).then(response => response.text()).then(mstContent => {
      console.log(mstContent);
        let isDiff = compareHash(mstContent);
        console.log(isDiff);
    })
}