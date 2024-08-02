import { Schema, model } from "mongoose";

const subscriptionSchema = new Schema(
  {
    data: {
      id: String,
      status: String,
      current_billing_period: {
        ends_at: { type: Date },
        starts_at: { type: Date },
      },
      address_id: String,
      created_at: Date,
      started_at: Date,
      updated_at: Date,
      canceled_at: Date,
      customer_id: String,
      currency_code: String,
      next_billed_at: Date,
      transaction_id: String,
    },
    event_id: String,
    event_type: String,
    occurred_at: Date,
    notification_id: String,
    email: String,
  },
  { timestamps: true }
);

export default model("Subscription", subscriptionSchema);
