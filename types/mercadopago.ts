export interface BrickPayer {
  email: string;
  identification?: {
    type: string;
    number: string;
  };
}

export interface BrickSubmitData {
  token?: string;
  payment_method_id?: string;
  issuer_id?: string;
  installments?: number;
  payer?: BrickPayer;
  formData?: {
    token?: string;
    payment_method_id?: string;
    issuer_id?: string;
    installments?: number;
    payer?: BrickPayer;
  };
}