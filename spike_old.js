// STATIC INFO
const phone_number = "1 (844) 587-6937";

// Utility:
const promiseTimeout = (ms, promise) => {
  let timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject('Timed out in '+ms+' ms.');
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

const handleResNotOk = (response) => {
  if (!response.ok) throw new Error(response.statusText)
  return response;
}

const showAddItemErr = (reason, err) => {
    alert("Sorry, we couldn't add your item to the cart because "+String(reason)+".\n Error: "+err.message);
    console.error(err);
}

// Integration:
class MyBC {
  carts() {
    const get_cart_path = '/api/storefront/carts?include=';
    const base_options = {
      'credentials': 'include',
      'headers': {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      }
    };
    return fetch(get_cart_path, base_options)
      .then(handleResNotOk)
      .then(r => r.json());
  };

  async addItem(productId, quantity) {
    const payload = JSON.stringify({
      'lineItems': [
        {
          "productId": String(productId),
          "quantity": Number(quantity)
        }
      ]
    });
    /* Why is get cartId logic not extracted to a separate fn?
        Because if there's no cart, you need an item to start
        a new one with. */
    const cs = await this.carts();
    let cart_endpoint;
    if (cs.length !== 0) { // if cart already exists, use it
      cart_endpoint = '/api/storefront/carts/' + cs[0].id + '/items';
    }
    else {                 // if cart doesn't exist, make a new one
      cart_endpoint = '/api/storefront/cart';
    }

    const res = await fetch(cart_endpoint, {
      method: "POST",
      credentials: "same-origin",
      headers: { "Content-Type": "application/json" },
      body: payload,
    });
    handleResNotOk(res);
    return await res.json();
  };
}

interface LookupSuccess {
  id: string;
}

interface LookupFailure {
  reason: string;
  error: Error;
}

enum LookupResult {
  LookupSuccess,
  LookupFailure
}

const lookup_id = async(ari_sku) => {
  const endpoint = "https://idlookup.aokpower.com/check/";
  try {
    const response = await fetch(endpoint+String(ari_sku));
  } catch (e) {
    showAddItemErr("the id lookup service couldn't be reached", e);
    throw e;
  }
  if (!response.ok) {
    showAddItemErr("there was an error with the part lookup service", e);
    throw e;
  }

  const text = await response.text();
  // response.text should be "" if lookup has no record for that sku
  if (text === "") return null;
  return text;
}

// Main
var bc = new MyBC();

showErrorMsg = (reason) => {
  return (err) => {
    const msg    = "Sorry, We couldn't add your item to the cart. We apologize for the inconvinience.\n";
    let reason   = "Reason: " + String(reason) + "\n";
    const errmsg = "Error: "+err.message+"\nIf you'd like to report this error, please email cooper@aokpowerequipment.com";
    alert(msg + reason + errmsg);
  }
}

// should either return a success value or error with human readable error.message
// const tryLookupAndAddItem = async(sku) => { // ...

// errors if => fn form is used
function addToCartARI(params_str) {
  // Convert string input into params object
  const params = params_str.split("&")
    .map(param_str => param_str.split("="))
    .reduce((obj, param_pair) => {
      obj[param_pair[0]] = param_pair[1];
      return obj;
    }, {});

  // extract this to separate async fn logic?
  lookup_id(params.arisku)
  .then(id => {
    if (id === null) { // Product in partsmart but not bigcommerce, not available
      alert("Sorry: This part isn't available in the online store. Try calling us at "+phone_number".");
      return null;
    }
    // TODO: Expects 2 args (find / add quantity)
    return bc.addItem(id);
  })
  .then(response => {
    // resolve result of bc.addItem
  });
}
