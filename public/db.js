const indexedDB =
  window.indexedDB ||
  window.mozeIndexedDB ||
  window.webkitIndexedDB ||
  window.msIndexedDB ||
  window.shimIndexedDB;

let db;
const request =  indexedDB.open("budget", 1);

//schema
request.onupgradeneeded = ({ target }) => {
  let db = target.result;
  db.createObjectStore("pending", { autoIncrement: true });
};

// if online check DB
request.onsuccess = ({ target }) => {
  console.log(target.result)

  db = target.result
  if (navigator.onLine) {
    checkDatabase();
  }

};
// deal with error
request.onerror = function(event) {
  console.log("Woops!" + event.target.errorCode)
};
// save record to db (called if offline - request fail)
function saveRecord(record) {
  // create a transaction on the pending db with readwrite access
  const transaction = db.transaction(["pending"], "readwrite");

  // access your pending object store
  const store = transaction.objectStore("pending");

  // add record to your store with add method.
  store.add(record);
};
// back online, send to mongo and clear pending (indexedDB)
function checkDatabase() {

    // open a transaction on your pending db
    const transaction = db.transaction(["pending"], "readwrite");
    // access your pending object store
    const store = transaction.objectStore("pending");
    // get all records from store and set to a variable
    const getAll = store.getAll();

    getAll.onsuccess = function() {
      if (getAll.result.length > 0) {
        fetch("/api/transaction/bulk", {
          method: "POST",
          body: JSON.stringify(getAll.result),
          headers: {
            Accept: "application/json, text/plain, */*",
            "Content-Type": "application/json"
          }
        })
        .then(response => response.json())
        .then(() => {
          // if successful, open a transaction on your pending db
          const transaction = db.transaction(["pending"], "readwrite");
  
          // access your pending object store
          const store = transaction.objectStore("pending");
  
          // clear all items in your store
          store.clear();
        });
      }
    };

};
// listen for app coming back online 
window.addEventListener("online", checkDatabase);