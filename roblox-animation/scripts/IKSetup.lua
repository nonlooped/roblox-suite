--!strict
-- Status: experimental
-- Last verified: 2026-06-17
-- Test coverage: no automated coverage
-- Intended use: example; adapt and test before production.

local IKSetup = {}

export type IKChainConfig = {
    parent: Instance,
    endEffector: BasePart | Bone,
    chainRoot: BasePart | Bone,
    target: Attachment | BasePart,
    type: Enum.IKControlType?,
    smoothTime: number?,
    p: number?,
}

function IKSetup.create(config: IKChainConfig): IKControl
    local ik = Instance.new("IKControl")
    ik.Type = config.type or Enum.IKControlType.Position
    ik.EndEffector = config.endEffector
    ik.ChainRoot = config.chainRoot
    if config.target:IsA("Attachment") then
        ik.Target = config.target :: Attachment
    else
        local targetAttachment = Instance.new("Attachment")
        targetAttachment.Name = "IKTarget"
        targetAttachment.Parent = config.target :: BasePart
        ik.Target = targetAttachment
    end
    ik.SmoothTime = config.smoothTime or 0.1
    ik.Weight = config.p or 1
    ik.Parent = config.parent
    ik.Enabled = true
    return ik
end

function IKSetup.createHingeConstraint(
    parent: BasePart,
    attachment0: Attachment,
    attachment1: Attachment,
    lowerAngle: number?,
    upperAngle: number?
): HingeConstraint
    local hinge = Instance.new("HingeConstraint")
    hinge.Attachment0 = attachment0
    hinge.Attachment1 = attachment1
    hinge.LimitsEnabled = true
    hinge.LowerAngle = lowerAngle or -90
    hinge.UpperAngle = upperAngle or 90
    hinge.Restitution = 0
    hinge.Parent = parent
    return hinge
end

return IKSetup
