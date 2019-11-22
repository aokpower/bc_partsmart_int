// STATIC INFO
const phone_number = "1 (844) 587-6937";

// Utility:
const promiseTimeout = (ms: number, promise: Promise<any>): Promise<any> => {
  let timeout = new Promise((resolve, reject) => {
    let id = setTimeout(() => {
      clearTimeout(id);
      reject('Timed out in '+ms+' ms.');
    }, ms);
  });

  return Promise.race([promise, timeout]);
}

const throwIfResNotOk = (response: Response): Response => {
  if (!response.ok) throw new Error(response.statusText)
  return response;
}

interface StringyObj { [key: string]: string }

// BigCommerce:
const carts = (): Promise<Array<StringyObj>> => {
  const get_cart_path = '/api/storefront/carts?include=';
  const base_options = {
    headers: {
      'Accept': 'application/json',
      'Content-Type': 'application/json',
      'credentials': 'include',
    }
  };
  return fetch(get_cart_path, base_options)
    .then(throwIfResNotOk)
    .then(r => r.json());
}

const addItem = async(productId: string, quantity: number) => {
  const payload = JSON.stringify({
    'lineItems': [
      {
        "productId": String(productId),
        "quantity": Number(quantity)
      }
    ]
  });
  /* Q: Why is get cartId logic not extracted to a separate fn?
     A: Because if there's no cart, you need an item to start
        a new one with. This tightly couples the logic of getting
        the carts and making a new one if there isn't one. */
  const cs = await carts();
  let cart_endpoint: string;
  if (cs.length !== 0) { // if cart already exists, use the first one
    cart_endpoint = '/api/storefront/carts/' + cs[0]["id"] + '/items';
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
  throwIfResNotOk(res);
  return await res.json();
}

// Lookup Service
interface LookupResult {
  id?: string;
  exists: boolean;
}

const lookupId = async(ari_sku: string): Promise<LookupResult> => {
  const endpoint: string = "https://idlookup.aokpower.com/check/";
  const response = await fetch(endpoint+String(ari_sku));
  if (!response.ok) throw new Error("There was an internal error in the part id lookup service.")

  const result = await response.text();
  if (result === "") return { exists: false };
  return { id: result, exists: true };
}

// ARI PartSmart
const parseAriParameters = (params_string: string): StringyObj => {
  return params_string.split("&")
    .map(param_string => param_string.split("="))
    .reduce((obj: StringyObj, param_pair) => {
      obj[param_pair[0]] = param_pair[1];
      return obj;
    }, {});
}

// Callback
/* Callback only works if addToCartARI is in traditional
   javascript "function _name_() ..." syntax */
function addToCartARI(params_str: string): void {
  const params = parseAriParameters(params_str);
  const arisku = params["arisku"];
  const quantity: number = Number(params["ariqty"]);

  lookupId(arisku).then(result => {
    if (!result.exists) throw new Error("This part ("+arisku+") isn't available in the online store.");
    // TODO: Should addItem in promise timeout?
    return addItem(result.id!, quantity);
  }).catch(err => {
    let msg = "";
    msg += "Something went wrong when we tried to add this item to the cart: \n";
    msg += err.message + "\n";
    msg += "We're sorry for the inconvenience, try calling us at "+phone_number+" and we might be able to resolve this issue for you."
    console.error(err);
    alert(msg);
  })
}
