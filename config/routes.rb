Rails.application.routes.draw do
  get "up" => "rails/health#show", as: :rails_health_check

  namespace :api do
    namespace :v1 do
      resources :links, only: %i[create show], param: :short_code do
        member { get :analytics }
      end
    end
  end

  get ":short_code", to: "redirects#show", constraints: { short_code: /[0-9a-zA-Z]+/ }
end
