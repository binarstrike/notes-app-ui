import { SignupFormSchemaType, tokensSchema, TokensSchemaType, signupFormSchema } from "./schema";
import { HttpStatusCode } from "axios";
import { PageEndpoints, isErrorResponse } from "./types";
import { MyModal, MyToast, fetchApi, handleError } from "./utils";

const formInput = {
  username: <HTMLInputElement>document.getElementById("username-form-input"),
  firstname: <HTMLInputElement>document.getElementById("firstname-form-input"),
  lastname: <HTMLInputElement>document.getElementById("lastname-form-input"),
  email: <HTMLInputElement>document.getElementById("email-form-input"),
  password: <HTMLInputElement>document.getElementById("password-form-input"),
};
const submitButton = <HTMLButtonElement>document.getElementById("submit-btn");

const toast = new MyToast();
const accountConflictModal = new MyModal("account-conflict", {
  title: "Account conflict",
  body: "Account already registered",
  positiveButton: "Login",
  negativeButton: "Close",
}).setButtonClickEventListener("modalPositiveButton", () => location.replace(PageEndpoints.LOGIN));

submitButton.addEventListener("click", async function (event) {
  event.preventDefault();
  try {
    const signupPayload: SignupFormSchemaType = signupFormSchema.parse({
      username: formInput.username?.value,
      firstname: formInput.firstname?.value,
      lastname: formInput.lastname?.value,
      email: formInput.email?.value,
      password: formInput.password?.value,
    });

    const fetchSignup = await fetchApi<TokensSchemaType, SignupFormSchemaType>(
      "AUTH_SIGNUP",
      signupPayload
    );

    const signupResponseData = fetchSignup.data;
    const tokens: TokensSchemaType = tokensSchema.parse(signupResponseData);
    Object.entries(tokens).forEach(([key, value]) => {
      localStorage.setItem(key, value);
    });
    location.replace(PageEndpoints.ROOT);
  } catch (error) {
    handleError(error, {
      zodError(e) {
        console.error(e);
        toast.showToast({
          title: "Validation error",
          message: `Please input ${e?.[0].path[0]} correctly`,
        });
      },
      axiosError(e) {
        const errorResponse = e?.data;
        if (isErrorResponse(errorResponse)) {
          switch (errorResponse.statusCode) {
            case HttpStatusCode.Conflict:
              accountConflictModal.modalToggle();
              return;
            default:
              console.log(errorResponse);
              toast.showToast({
                title: "API error",
                message: "Error when trying fetch data from API",
              });
          }
        }
      },
      anyError(e) {
        console.error(e?.message);
        toast.showToast({
          title: "Login Error",
          message: "An error occurred when user trying to signup",
        });
      },
    });
  }
});