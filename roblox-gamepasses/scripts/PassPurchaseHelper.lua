--!strict
--[[
PassPurchaseHelper.lua
Client-side helper for game pass purchase UI state and prompting.

Usage:
local PassHelper = require(...)
local helper = PassHelper.new(PASS_ID)
helper:connectButton(myBuyButton)
helper:refreshState()
]]

local MarketplaceService = game:GetService("MarketplaceService")
local Players = game:GetService("Players")

type ProductInfo = {
	IsForSale: boolean,
	PriceInRobux: number?,
	Name: string?,
	Description: string?,
	[string]: any,
}

export type PassPurchaseHelper = {
	passID: number,
	_player: Player?,
	_owns: boolean,
	_button: GuiButton?,
	_activatedConnection: RBXScriptConnection?,
	_promptFinishedConnection: RBXScriptConnection?,

	new: (passID: number) -> PassPurchaseHelper,
	checkOwnership: (self: PassPurchaseHelper) -> (boolean, boolean?, string?),
	promptPurchase: (self: PassPurchaseHelper) -> (boolean, string?),
	connectButton: (self: PassPurchaseHelper, button: GuiButton) -> (),
	refreshState: (self: PassPurchaseHelper) -> (),
	destroy: (self: PassPurchaseHelper) -> (),
}

local PassPurchaseHelper = {}
PassPurchaseHelper.__index = PassPurchaseHelper

function PassPurchaseHelper.new(passID: number): PassPurchaseHelper
	if typeof(passID) ~= "number" or passID <= 0 or passID % 1 ~= 0 then
		error("PassPurchaseHelper.new expects a positive integer passID, got " .. tostring(passID), 2)
	end

	local self = setmetatable({}, PassPurchaseHelper) :: PassPurchaseHelper
	self.passID = passID
	self._player = Players.LocalPlayer
	self._owns = false
	self._button = nil
	self._activatedConnection = nil
	self._promptFinishedConnection = nil

	self._promptFinishedConnection = MarketplaceService.PromptGamePassPurchaseFinished:Connect(
		function(player: Player, purchasedPassID: number, purchaseSuccess: boolean)
			if player == self._player and purchaseSuccess and purchasedPassID == self.passID then
				self._owns = true
				self:_updateButton("Owned", false)
			end
		end
	)

	if self._player then
		task.spawn(function()
			self:_refreshButtonState()
		end)
	else
		task.spawn(function()
			self._player = Players.LocalPlayer
			if not self._player then
				self._player = Players.PlayerAdded:Wait()
			end
			self:_refreshButtonState()
		end)
	end

	return self
end

function PassPurchaseHelper:_updateButton(text: string, active: boolean): ()
	local button = self._button
	if not button then
		return
	end
	button.Text = text
	button.Active = active
	button.AutoButtonColor = active
end

function PassPurchaseHelper:_getProductInfoAsync(): (boolean, ProductInfo?, string?)
	local success, productInfo = pcall(function()
		return MarketplaceService:GetProductInfoAsync(self.passID, Enum.InfoType.GamePass)
	end)
	if success then
		return true, productInfo :: ProductInfo?, nil
	end
	return false, nil, tostring(productInfo)
end

function PassPurchaseHelper:checkOwnership(): (boolean, boolean?, string?)
	local player = self._player
	if not player then
		return false, nil, "LocalPlayer not available"
	end
	local success, result = pcall(function()
		return MarketplaceService:UserOwnsGamePassAsync(player.UserId, self.passID)
	end)
	if success then
		self._owns = result :: boolean
		return true, result :: boolean, nil
	end
	return false, nil, tostring(result)
end

function PassPurchaseHelper:promptPurchase(): (boolean, string?)
	local player = self._player
	if not player then
		return false, "LocalPlayer not available"
	end

	local ownsSuccess, owns, ownsErr = self:checkOwnership()
	if not ownsSuccess then
		return false, ownsErr or "Ownership check failed"
	end
	if owns then
		return false, "Already owns"
	end

	local infoSuccess, productInfo, infoErr = self:_getProductInfoAsync()
	if not infoSuccess then
		return false, "Unable to verify pass sale status: " .. (infoErr or "unknown")
	end
	if not productInfo or not productInfo.IsForSale then
		return false, "Pass is not for sale"
	end

	local promptSuccess, promptErr = pcall(function()
		MarketplaceService:PromptGamePassPurchase(player, self.passID)
	end)
	if not promptSuccess then
		warn("Failed to prompt gamepass purchase:", promptErr)
		return false, tostring(promptErr)
	end
	return true, nil
end

function PassPurchaseHelper:connectButton(button: GuiButton): ()
	self._button = button

	if self._activatedConnection then
		self._activatedConnection:Disconnect()
		self._activatedConnection = nil
	end

	self._activatedConnection = button.Activated:Connect(function()
		local ownsSuccess, owns, ownsErr = self:checkOwnership()
		if ownsSuccess and not owns then
			self:promptPurchase()
		elseif not ownsSuccess then
			warn("PassPurchaseHelper ownership check failed:", ownsErr)
		end
	end)

	task.spawn(function()
		self:_refreshButtonState()
	end)
end

function PassPurchaseHelper:_refreshButtonState(): ()
	local button = self._button
	if not button then
		return
	end

	local player = self._player
	if not player then
		self:_updateButton("Loading...", false)
		return
	end

	local infoSuccess, productInfo, infoErr = self:_getProductInfoAsync()
	if not infoSuccess or not productInfo then
		warn("Failed to get product info:", infoErr)
		self:_updateButton("Not Available", false)
		return
	end

	if not productInfo.IsForSale then
		self:_updateButton("Not For Sale", false)
		return
	end

	local ownsSuccess, owns, ownsErr = self:checkOwnership()
	if not ownsSuccess then
		warn("Failed to check gamepass ownership:", ownsErr)
		self:_updateButton("Check Failed", false)
		return
	end

	if owns then
		self:_updateButton("Owned", false)
	else
		local price = productInfo.PriceInRobux or "?"
		self:_updateButton("Purchase " .. price .. "R$", true)
	end
end

function PassPurchaseHelper:refreshState(): ()
	task.spawn(function()
		self:_refreshButtonState()
	end)
end

function PassPurchaseHelper:destroy(): ()
	if self._activatedConnection then
		self._activatedConnection:Disconnect()
		self._activatedConnection = nil
	end
	if self._promptFinishedConnection then
		self._promptFinishedConnection:Disconnect()
		self._promptFinishedConnection = nil
	end
	self._button = nil
end

return PassPurchaseHelper
