// Note: Relies on AlertifyJS library
// AlertifyJS type declarations
interface AlertifyJSStatic {
  success(msg: string): void;
  error(msg: string): void;
  alert(msg: string): void;
}

declare var alertify: AlertifyJSStatic;


// STATIC INFO
const phone_number = "1 (844) 587-6937";

// Utility:
const promiseTimeout = (ms: number, promise: Promise<any>): Promise<any> => {
  let timeout = new Promise((_resolve, reject) => {
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
type CartJSON = StringyObj; // more specified type alias

class BCCart {
  public exists: boolean;
  private id: string | null;
  private cart: CartJSON | null;
  private get_cart_path: string;
  private carts: Array<CartJSON>;

  /* Call instance methods through here. Constructs a new instance and updates.
     At the end of the promise chain, the instance should be thrown away. This,
     along with the private constructor, give at least a weak guarantee of cart
     data being fresh and prevents a lot of async headaches while enabling some
     synchronous accessors internally in the chain. */
  
  public static async do(): Promise<BCCart> {
    return (new BCCart).update()
  }

  private constructor() {
    this.carts = [];
    this.cart = null;
    this.id = null;
    this.exists = false;

    this.get_cart_path = '/api/storefront/carts?include=';
  }

  public async update(): Promise<BCCart> {
    this.carts = await this.get_carts();
    this.exists = this.carts.length > 0;
    this.cart = this.carts[0] || null;
    this.id = this.cart && this.cart["id"] || null;
    return this;
  }

  public async addItem(productId: string, quantity: number): Promise<CartJSON> {
    const payload = JSON.stringify({
      'lineItems': [{
        "productId": String(productId),
        "quantity": Number(quantity)
      }]
    });
    let cart_endpoint: string;
    if (this.exists) { // if cart already exists, use the first one
      cart_endpoint = '/api/storefront/carts/' + this.id + '/items';
    } else {              // if cart doesn't exist, make a new one
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

  private get_carts(): Promise<Array<CartJSON>> {
    return fetch(this.get_cart_path, {
      headers: {
        'accept': 'application/json',
        'content-type': 'application/json',
        'credentials': 'include',
      }
    }).then(throwIfResNotOk)
      .then(r => r.json());
  }
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
  console.log("Attempting to add product "+arisku+" to cart.");
  const quantity: number = Number(params["ariqty"]);

  lookupId(arisku).then(result => {
    console.log("looking up part "+arisku+"...");
    if (!result.exists) throw new Error("This part ("+arisku+") isn't available in the online store.");
    console.log("Found "+arisku+", id = "+result.id!);
    return BCCart.do().then(cart => {
      return cart.addItem(result.id!, quantity).then(_ => {
        const msg = "Successfully added " + arisku + " to cart.";
        console.log(msg);
        alertify.success(msg);
      })
    })
  }).catch(err => {
    let msg = "";
    msg += "Something went wrong when we tried to add this item to the cart: \n";
    msg += err.message + "\n";
    msg += "We're sorry for the inconvenience, try calling us at " + phone_number + " and we might be able to resolve this issue for you."
    alertify.alert(msg);
    console.error(msg);
  });
}
