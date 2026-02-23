# frozen_string_literal: true

# Exclude Devise's mailers from Zeitwerk. The gem's app/mailers/devise/mailer.rb
# doesn't define the constant in the way Zeitwerk expects (Devise::Mailer), which
# causes Zeitwerk::NameError when eager loading. Devise loads its mailer itself.
Rails.autoloaders.main.ignore(Devise::Engine.root.join("app/mailers"))
