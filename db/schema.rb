# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# This file is the source Rails uses to define your schema when running `bin/rails
# db:schema:load`. When creating a new database, `bin/rails db:schema:load` tends to
# be faster and is potentially less error prone than running all of your
# migrations from scratch. Old migrations may fail to apply correctly if those
# migrations use external dependencies or application code.
#
# It's strongly recommended that you check this file into your version control system.

ActiveRecord::Schema[7.2].define(version: 2025_02_23_000002) do
  # These are extensions that must be enabled in order to support this database
  enable_extension "plpgsql"

  create_table "links", force: :cascade do |t|
    t.string "url", null: false
    t.string "short_code"
    t.string "title"
    t.integer "clicks_count", default: 0, null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "icon_url"
    t.bigint "user_id"
    t.index ["short_code"], name: "index_links_on_short_code", unique: true
    t.index ["user_id", "created_at"], name: "index_links_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_links_on_user_id"
  end

  create_table "user_sessions", force: :cascade do |t|
    t.bigint "user_id", null: false
    t.string "token", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["token"], name: "index_user_sessions_on_token", unique: true
    t.index ["user_id", "created_at"], name: "index_user_sessions_on_user_id_and_created_at"
    t.index ["user_id"], name: "index_user_sessions_on_user_id"
  end

  create_table "users", force: :cascade do |t|
    t.string "email", null: false
    t.string "password_digest", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.index ["email"], name: "index_users_on_email", unique: true
  end

  create_table "visits", force: :cascade do |t|
    t.bigint "link_id", null: false
    t.string "ip_address"
    t.text "user_agent"
    t.string "geolocation"
    t.datetime "visited_at", null: false
    t.datetime "created_at", null: false
    t.datetime "updated_at", null: false
    t.string "country"
    t.index ["country"], name: "index_visits_on_country"
    t.index ["link_id", "visited_at"], name: "index_visits_on_link_id_and_visited_at"
    t.index ["link_id"], name: "index_visits_on_link_id"
  end

  add_foreign_key "links", "users"
  add_foreign_key "user_sessions", "users"
  add_foreign_key "visits", "links"
end
