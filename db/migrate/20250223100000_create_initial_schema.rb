# frozen_string_literal: true

class CreateInitialSchema < ActiveRecord::Migration[7.2]
  def change
    create_table :users do |t|
      t.string :email, null: false
      t.string :password_digest, null: false
      t.timestamps
    end
    add_index :users, :email, unique: true

    create_table :sessions do |t|
      t.references :user, null: false, foreign_key: true
      t.string :token, null: false
      t.timestamps
    end
    add_index :sessions, :token, unique: true
    add_index :sessions, %i[user_id created_at]

    create_table :links do |t|
      t.references :user, null: true, foreign_key: true
      t.string :target_url, null: false
      t.string :key
      t.string :title
      t.string :icon_url
      t.integer :clicks_count, null: false, default: 0
      t.timestamps
    end
    add_index :links, :key, unique: true
    add_index :links, %i[user_id created_at]

    create_table :clicks do |t|
      t.references :link, null: false, foreign_key: true
      t.datetime :clicked_at, null: false
      t.string :ip_address
      t.string :country
      t.text :user_agent
      t.string :geolocation
      t.timestamps
    end
    add_index :clicks, %i[link_id clicked_at]
    add_index :clicks, :country
  end
end
